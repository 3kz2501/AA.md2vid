# AA.md2vid MCP Server

MCP (Model Context Protocol) server for AA.md2vid - Generate Yaruo/Yaranai videos from Markdown.

## Installation

```bash
cd mcp-server
uv sync
```

## Usage

### Run the server

```bash
uv run aa-md2vid-mcp
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AA_MD2VID_ROOT` | Parent directory | AA.md2vid project root |
| `AA_MD2VID_USE_DOCKER` | `true` | Use Docker for commands |
| `VOICEVOX_ENDPOINT` | `http://localhost:50021` | VOICEVOX API endpoint |

## Available Tools

| Tool | Description |
|------|-------------|
| `create_slide` | Create a Marp slide file |
| `create_manuscript` | Create a manuscript file |
| `generate_slide_images` | Generate PNG from Marp slide |
| `preprocess` | Parse manuscript + generate voices |
| `render` | Render final MP4 video |
| `list_speakers` | List VOICEVOX speakers |
| `get_workflow_status` | Get current status |

## Claude Desktop Configuration

### macOS

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
"aa-md2vid": {
  "command": "docker",
  "args": [
    "run", "-i", "--rm",
    "-v", "<AA.md2vid path>/input:/app/input",
    "-v", "<AA.md2vid path>/out:/app/out",
    "-v", "<AA.md2vid path>/public:/app/public",
    "-v", "/var/run/docker.sock:/var/run/docker.sock",
    "-e", "AA_MD2VID_ROOT=/app",
    "-e", "HOST_PROJECT_ROOT=<AA.md2vid path>",
    "-e", "AA_MD2VID_CONTAINER=aa-md2vid-app",
    "-e", "VOICEVOX_ENDPOINT=http://host.docker.internal:50021",
    "aa-md2vid-mcp"
  ]
}
```

## Workflow Example

1. Start Docker containers:
   ```bash
   cd /path/to/AA.md2vid
   docker-compose up -d
   ```

2. Use Claude to create a video:
   - Create slide with `create_slide`
   - Generate images with `generate_slide_images`
   - Create manuscript with `create_manuscript`
   - Run `preprocess`
   - Run `render`

3. Output will be in `out/video.mp4`
