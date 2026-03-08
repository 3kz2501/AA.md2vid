"""Command execution utilities for AA.md2vid MCP server."""

import asyncio
import os
import shutil
from dataclasses import dataclass
from pathlib import Path


@dataclass
class CommandResult:
    """Result of a command execution."""

    returncode: int
    stdout: str
    stderr: str

    @property
    def success(self) -> bool:
        return self.returncode == 0


def get_project_root() -> Path:
    """Get the AA.md2vid project root directory."""
    root = os.environ.get("AA_MD2VID_ROOT")
    if root:
        return Path(root)
    # Default: parent of mcp-server directory
    return Path(__file__).parent.parent.parent.parent.parent


def get_host_project_root() -> str:
    """Get the host machine's project root path (for Docker mounts)."""
    return os.environ.get("HOST_PROJECT_ROOT", str(get_project_root()))


def get_voicevox_endpoint() -> str:
    """Get the VOICEVOX endpoint URL."""
    return os.environ.get("VOICEVOX_ENDPOINT", "http://localhost:50021")


def get_container_name() -> str:
    """Get the AA.md2vid app container name."""
    return os.environ.get("AA_MD2VID_CONTAINER", "aa-md2vid-app")


async def run_command(
    cmd: list[str],
    cwd: Path | None = None,
    env: dict[str, str] | None = None,
    timeout: float = 300.0,
) -> CommandResult:
    """Run a command and return the result."""
    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        cwd=cwd,
        env={**os.environ, **(env or {})},
    )

    try:
        stdout, stderr = await asyncio.wait_for(
            process.communicate(), timeout=timeout
        )
    except asyncio.TimeoutError:
        process.kill()
        await process.wait()
        return CommandResult(
            returncode=-1,
            stdout="",
            stderr=f"Command timed out after {timeout} seconds",
        )

    return CommandResult(
        returncode=process.returncode or 0,
        stdout=stdout.decode("utf-8", errors="replace"),
        stderr=stderr.decode("utf-8", errors="replace"),
    )


async def run_npm_command(
    npm_args: list[str],
    timeout: float = 300.0,
) -> CommandResult:
    """Run an npm command in the aa-md2vid-app container."""
    container = get_container_name()

    # Check if container is running
    check = await run_command(["docker", "ps", "-q", "-f", f"name={container}"])
    if not check.stdout.strip():
        return CommandResult(
            returncode=1,
            stdout="",
            stderr=f"Docker container '{container}' is not running. Run 'docker-compose up -d' first.",
        )

    cmd = ["docker", "exec", "-i", container, "npm", *npm_args]
    return await run_command(cmd, timeout=timeout)


async def run_marp_cli(
    slide_path: str,
    output_dir: str,
    timeout: float = 120.0,
) -> CommandResult:
    """Run Marp CLI using the official Docker image."""
    host_root = get_host_project_root()

    # Use absolute paths inside container
    cmd = [
        "docker", "run", "--rm",
        "-v", f"{host_root}:/workspace",
        "marpteam/marp-cli",
        f"/workspace/{slide_path}",
        "--images", "png",
        "-o", f"/workspace/{output_dir}/slide.png",
    ]
    return await run_command(cmd, timeout=timeout)
