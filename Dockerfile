# 阶段 1: 构建前端
FROM docker.1ms.run/node:20-alpine AS builder

WORKDIR /app

# 复制依赖配置
COPY package*.json ./

# 安装所有依赖（包括 devDependencies 用于构建）
RUN npm ci

# 复制源代码
COPY . .

# 构建前端 (生成 dist 文件夹)
RUN npm run build

# 阶段 2: 运行环境
FROM docker.1ms.run/node:20-alpine

WORKDIR /app

# 复制依赖配置
COPY package*.json ./

# 只安装生产环境依赖 (express, cors 等)
RUN npm ci --omit=dev

# 从构建阶段复制构建好的前端文件
COPY --from=builder /app/dist ./dist

# 复制后端服务器代码
COPY server.js ./
# 复制其他必要配置 (如 types.ts 或 constants.tsx 如果后端有引用，但在你的代码里server.js只用了标准库和npm包，所以这行可以省略，为了保险复制当前目录所有文件排除忽略文件)
# 这里为了精简，我们直接复制 server.js 即可，因为 server.js 是独立的

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["npm", "start"]
