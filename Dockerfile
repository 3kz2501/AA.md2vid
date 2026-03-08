# AA.md2vid Docker Image
# Node.js 22 with Chromium (for Marp CLI) and ffmpeg (for Remotion)

FROM node:22-bookworm-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Chromium dependencies for Marp CLI
    chromium \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    # ffmpeg for Remotion rendering
    ffmpeg \
    # Japanese fonts
    fonts-noto-cjk \
    fonts-noto-cjk-extra \
    # Utilities
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV CHROME_PATH=/usr/bin/chromium

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Create necessary directories
RUN mkdir -p input/manuscripts input/slides input/images public/voices out

# Default command (can be overridden)
CMD ["npm", "run", "studio"]
