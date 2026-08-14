# 零碳厨房共创征集 · 一体化镜像（前端静态 + 表单后端 + 管理后台）
# 构建：docker build -t zc-kitchen .
# 运行：docker run -d --name zc-kitchen -p 80:8080 -v zc-data:/app/server/data -e ADMIN_KEY=换成强密钥 zc-kitchen

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8080
COPY --from=build /app/dist ./dist
COPY server ./server
RUN mkdir -p server/data && addgroup -S app && adduser -S app -G app \
  && chown -R app:app /app
USER app
EXPOSE 8080
VOLUME ["/app/server/data"]
CMD ["node", "server/server.js"]
