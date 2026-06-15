FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
# npm ci is cleaner and faster for production container builds
RUN npm ci --only=production

COPY . .

# CRITICAL: Ensure the uploads folder exists
RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "server.js"]