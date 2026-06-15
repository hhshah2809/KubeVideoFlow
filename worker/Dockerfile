FROM node:20-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# CRITICAL: Ensure the worker also has the uploads folder structure for the shared volume
RUN mkdir -p uploads

CMD ["node", "worker.js"]