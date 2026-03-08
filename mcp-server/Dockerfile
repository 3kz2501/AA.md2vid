FROM python:3.12-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Install docker CLI from official Docker image
COPY --from=docker:cli /usr/local/bin/docker /usr/local/bin/docker

WORKDIR /mcp-server

# Copy project files
COPY pyproject.toml .
COPY README.md .
COPY src/ src/

# Install dependencies
RUN uv sync

# Run the MCP server
CMD ["uv", "run", "aa-md2vid-mcp"]
