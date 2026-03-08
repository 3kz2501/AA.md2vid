"""MCP tool implementations for AA.md2vid."""

import httpx

from .docker import (
    get_container_name,
    get_project_root,
    get_voicevox_endpoint,
    run_command,
    run_marp_cli,
    run_npm_command,
)


async def create_slide(name: str, content: str) -> dict:
    """Create a Marp slide file.

    Args:
        name: Slide name (without .md extension)
        content: Marp markdown content

    Returns:
        Result dict with success status and file path
    """
    root = get_project_root()
    slide_path = root / "input" / "slides" / f"{name}.md"

    # Create directory if needed
    slide_path.parent.mkdir(parents=True, exist_ok=True)

    # Write slide content
    slide_path.write_text(content, encoding="utf-8")

    # Create output directory for images
    output_dir = root / "input" / "slides" / name
    output_dir.mkdir(parents=True, exist_ok=True)

    return {
        "success": True,
        "path": str(slide_path),
        "output_dir": str(output_dir),
        "message": f"Slide created at {slide_path}",
    }


async def create_manuscript(name: str, content: str) -> dict:
    """Create a manuscript (script) file.

    Args:
        name: Manuscript name (without .md extension)
        content: Markdown manuscript content with YAML frontmatter

    Returns:
        Result dict with success status and file path
    """
    root = get_project_root()
    manuscript_path = root / "input" / "manuscripts" / f"{name}.md"

    # Create directory if needed
    manuscript_path.parent.mkdir(parents=True, exist_ok=True)

    # Write manuscript content
    manuscript_path.write_text(content, encoding="utf-8")

    return {
        "success": True,
        "path": str(manuscript_path),
        "message": f"Manuscript created at {manuscript_path}",
    }


async def generate_slide_images(name: str) -> dict:
    """Generate PNG images from a Marp slide.

    Args:
        name: Slide name (without .md extension)

    Returns:
        Result dict with success status and generated files
    """
    root = get_project_root()
    slide_path = f"input/slides/{name}.md"
    output_dir = f"input/slides/{name}"

    # Check if slide exists
    abs_slide = root / slide_path
    if not abs_slide.exists():
        return {
            "success": False,
            "error": f"Slide not found: {abs_slide}",
        }

    # Create output directory
    abs_output = root / output_dir
    abs_output.mkdir(parents=True, exist_ok=True)

    # Run Marp CLI
    result = await run_marp_cli(slide_path, output_dir)

    if result.success:
        # List generated files
        generated = list(abs_output.glob("slide*.png"))
        return {
            "success": True,
            "files": [str(f) for f in generated],
            "count": len(generated),
            "message": f"Generated {len(generated)} slide image(s)",
        }
    else:
        return {
            "success": False,
            "error": result.stderr or result.stdout,
        }


async def preprocess(manuscript: str) -> dict:
    """Run preprocessing (parse manuscript + generate voices).

    Args:
        manuscript: Manuscript name (without .md extension)

    Returns:
        Result dict with success status
    """
    result = await run_npm_command(
        ["run", "preprocess", "--", "--manuscript", manuscript],
        timeout=600.0,  # Voice generation can take time
    )

    if result.success:
        return {
            "success": True,
            "message": f"Preprocessing completed for '{manuscript}'",
            "stdout": result.stdout,
        }
    else:
        return {
            "success": False,
            "error": result.stderr or result.stdout,
        }


async def render(output_name: str = "video.mp4") -> dict:
    """Render the final video.

    Args:
        output_name: Output filename (default: video.mp4)

    Returns:
        Result dict with success status and output path
    """
    root = get_project_root()

    result = await run_npm_command(
        ["run", "render"],
        timeout=1800.0,  # Rendering can take a long time
    )

    if result.success:
        output_path = root / "out" / output_name
        return {
            "success": True,
            "path": str(output_path),
            "message": f"Video rendered to {output_path}",
            "stdout": result.stdout,
        }
    else:
        return {
            "success": False,
            "error": result.stderr or result.stdout,
        }


async def list_speakers() -> dict:
    """List available VOICEVOX speakers.

    Returns:
        Result dict with speaker list
    """
    endpoint = get_voicevox_endpoint()

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{endpoint}/speakers")
            response.raise_for_status()
            speakers = response.json()

            # Format speaker list
            speaker_list = []
            for speaker in speakers:
                for style in speaker.get("styles", []):
                    speaker_list.append({
                        "name": speaker["name"],
                        "style": style["name"],
                        "voice_id": style["id"],
                    })

            return {
                "success": True,
                "speakers": speaker_list,
                "count": len(speaker_list),
            }
    except httpx.HTTPError as e:
        return {
            "success": False,
            "error": f"Failed to connect to VOICEVOX: {e}",
        }


async def get_workflow_status() -> dict:
    """Get the current workflow status.

    Returns:
        Status of manuscripts, slides, voices, and outputs
    """
    root = get_project_root()

    # Check manuscripts
    manuscripts_dir = root / "input" / "manuscripts"
    manuscripts = [
        f.stem for f in manuscripts_dir.glob("*.md")
        if not f.stem.startswith("_")
    ] if manuscripts_dir.exists() else []

    # Check slides
    slides_dir = root / "input" / "slides"
    slides = [
        f.stem for f in slides_dir.glob("*.md")
        if not f.stem.startswith("_")
    ] if slides_dir.exists() else []

    # Check slide images
    slide_images = {}
    if slides_dir.exists():
        for slide in slides:
            img_dir = slides_dir / slide
            if img_dir.is_dir():
                images = list(img_dir.glob("slide*.png"))
                slide_images[slide] = len(images)

    # Check voices
    voices_dir = root / "public" / "voices"
    voice_files = list(voices_dir.glob("*.wav")) if voices_dir.exists() else []

    # Check outputs
    out_dir = root / "out"
    outputs = list(out_dir.glob("*.mp4")) if out_dir.exists() else []

    # Check Docker CLI availability
    docker_status = "not available"
    docker_result = await run_command(["docker", "version", "--format", "{{.Client.Version}}"])
    if docker_result.success:
        docker_status = f"available (v{docker_result.stdout.strip()})"

    # Check aa-md2vid-app container
    container_name = get_container_name()
    container_status = "not running"
    if docker_result.success:
        container_check = await run_command(
            ["docker", "ps", "-q", "-f", f"name={container_name}"]
        )
        if container_check.stdout.strip():
            container_status = "running"

    # Check marpteam/marp-cli image
    marp_image_status = "not pulled"
    if docker_result.success:
        marp_check = await run_command(
            ["docker", "images", "-q", "marpteam/marp-cli"]
        )
        if marp_check.stdout.strip():
            marp_image_status = "available"

    # Check VOICEVOX status
    voicevox_status = "unknown"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{get_voicevox_endpoint()}/version")
            if response.status_code == 200:
                version = response.text.strip('"')
                voicevox_status = f"running (v{version})"
            else:
                voicevox_status = "error"
    except Exception:
        voicevox_status = "not running"

    return {
        "success": True,
        "project_root": str(root),
        "docker": docker_status,
        "container_aa_md2vid": container_status,
        "marp_cli_image": marp_image_status,
        "voicevox": voicevox_status,
        "manuscripts": manuscripts,
        "slides": slides,
        "slide_images": slide_images,
        "voice_count": len(voice_files),
        "outputs": [str(f.name) for f in outputs],
    }
