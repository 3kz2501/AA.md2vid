"""MCP Server for AA.md2vid."""

import json

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

from . import tools

# Create the MCP server
server = Server("aa-md2vid")


@server.list_tools()
async def list_tools() -> list[Tool]:
    """List available tools."""
    return [
        Tool(
            name="create_slide",
            description="""Create a Marp slide file for the video background.

TEMPLATE FORMAT:
```markdown
---
marp: true
theme: default
paginate: true
style: |
  section {
    font-size: 24px;
  }
---

# Slide 1: Title

- Point 1
- Point 2

---

# Slide 2: Details

Detailed explanation...
```

GUIDELINES:
- Each slide is separated by `---`
- Use `# Heading` for slide titles
- Keep content concise (will be shown behind characters)
- Use bullet points for key information
- Typically 3-8 slides for a video""",
            inputSchema={
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Slide name (without .md extension)",
                    },
                    "content": {
                        "type": "string",
                        "description": "Marp markdown content following the template format",
                    },
                },
                "required": ["name", "content"],
            },
        ),
        Tool(
            name="create_manuscript",
            description="""Create a manuscript (script) file with Yaruo/Yaranai character dialogues.

TEMPLATE FORMAT:
```markdown
---
title: やる夫で学ぶ [Topic]
bgm: bgm/chillhop.mp3
slides: slides/[slide_name].md
characters:
  - name: やる夫
    voiceId: 3
    direction: left
  - name: やらない夫
    voiceId: 11
    direction: right
pronunciations:
  "やらない夫": "やらないお"
  "やる夫": "やるお"
  "難読語": "よみかた"
---

@slide 1

[やる夫] First line of dialogue.

[やらない夫:explain] Explanation dialogue.

@slide 2

[やる夫:surprised] Surprised reaction!

[やらない夫:thinking] Thoughtful response.
```

CHARACTER ROLES:
- やる夫 (Yaruo): Viewer perspective, asks questions, shows surprise
- やらない夫 (Yaranai): Explainer, provides information, delivers punchlines

EMOTION TAGS:
- やる夫: normal, happy, sad, cry, angry, surprised, troubled, shy, grit, dead, wink
- やらない夫: normal, explain, happy, happy2, sad, despair, angry, surprised, troubled, thinking, question, pointing, waving, arms_crossed, casual

GUIDELINES:
- Use @slide N to sync with slide changes
- Format: [Character] or [Character:emotion] followed by dialogue
- Keep dialogues natural and conversational
- Add pronunciations for difficult words or English terms""",
            inputSchema={
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Manuscript name (without .md extension, should match slide name)",
                    },
                    "content": {
                        "type": "string",
                        "description": "Markdown manuscript following the template format with YAML frontmatter and dialogue",
                    },
                },
                "required": ["name", "content"],
            },
        ),
        Tool(
            name="generate_slide_images",
            description="Generate PNG images from a Marp slide using Marp CLI",
            inputSchema={
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Slide name (without .md extension)",
                    },
                },
                "required": ["name"],
            },
        ),
        Tool(
            name="preprocess",
            description="Run preprocessing: parse manuscript and generate voice audio",
            inputSchema={
                "type": "object",
                "properties": {
                    "manuscript": {
                        "type": "string",
                        "description": "Manuscript name (without .md extension)",
                    },
                },
                "required": ["manuscript"],
            },
        ),
        Tool(
            name="render",
            description="Render the final MP4 video using Remotion",
            inputSchema={
                "type": "object",
                "properties": {
                    "output_name": {
                        "type": "string",
                        "description": "Output filename (default: video.mp4)",
                        "default": "video.mp4",
                    },
                },
                "required": [],
            },
        ),
        Tool(
            name="list_speakers",
            description="List available VOICEVOX speakers and their voice IDs",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": [],
            },
        ),
        Tool(
            name="get_workflow_status",
            description="Get current workflow status: manuscripts, slides, voices, outputs",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": [],
            },
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    """Handle tool calls."""
    try:
        if name == "create_slide":
            result = await tools.create_slide(
                name=arguments["name"],
                content=arguments["content"],
            )
        elif name == "create_manuscript":
            result = await tools.create_manuscript(
                name=arguments["name"],
                content=arguments["content"],
            )
        elif name == "generate_slide_images":
            result = await tools.generate_slide_images(
                name=arguments["name"],
            )
        elif name == "preprocess":
            result = await tools.preprocess(
                manuscript=arguments["manuscript"],
            )
        elif name == "render":
            result = await tools.render(
                output_name=arguments.get("output_name", "video.mp4"),
            )
        elif name == "list_speakers":
            result = await tools.list_speakers()
        elif name == "get_workflow_status":
            result = await tools.get_workflow_status()
        else:
            result = {"success": False, "error": f"Unknown tool: {name}"}

        return [TextContent(type="text", text=json.dumps(result, indent=2, ensure_ascii=False))]

    except Exception as e:
        error_result = {"success": False, "error": str(e)}
        return [TextContent(type="text", text=json.dumps(error_result, indent=2))]


def main():
    """Run the MCP server."""
    import asyncio

    async def run():
        async with stdio_server() as (read_stream, write_stream):
            await server.run(read_stream, write_stream, server.create_initialization_options())

    asyncio.run(run())


if __name__ == "__main__":
    main()
