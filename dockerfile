# File: Dockerfile

# 1. Builder stage: install dependencies, Chromium, and build the Next.js app
FROM node:18-alpine AS builder
WORKDIR /usr/src/app

# Install Chromium and required libraries for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Tell Puppeteer where to find Chromium, and skip its bundled download
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Install all dependencies and build the app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# 2. Production stage: only prod dependencies + built output
FROM node:18-alpine
WORKDIR /usr/src/app

# Install production dependencies only
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy the built Next.js output
COPY --from=builder /usr/src/app/.next .next

# Expose the port and start the app
ENV PORT=8080
EXPOSE 8080
CMD ["npm", "start"]
