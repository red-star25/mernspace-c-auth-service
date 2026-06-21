FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:18-alpine as production

ENV NODE_ENV=production

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm ci --ignore-scripts

COPY --from=builder /app/dist ./dist

EXPOSE 5500

CMD ["node", "dist/server.js"]