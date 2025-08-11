FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm i --no-audit --no-fund
COPY . .
EXPOSE 3003
CMD ["node", "index.js"]
