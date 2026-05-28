FROM node:20-alpine

WORKDIR /app

# 의존성만 먼저 복사해 레이어 캐시 활용
COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000
CMD ["npm", "start"]
