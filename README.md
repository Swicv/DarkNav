<img width="1919" height="986" alt="image" src="https://github.com/user-attachments/assets/559901dc-6322-4c73-874d-db9e74868551" />

# Dark's Nav

Dark's Nav 是一个基于 React + Vite + Node.js/Express 的轻量导航页。前端由 Vite 构建，后端负责提供静态页面、读取/保存导航数据，以及管理员登录验证。

数据保存在项目根目录的 `data.json` 中，Docker 部署时通过单文件挂载持久化到容器内的 `/app/data.json`。

## 功能

- 分类导航与链接管理
- 管理员登录后添加、编辑、删除分类和链接
- JSON 配置导入/导出
- 浏览器书签 HTML 导入
- 本地导航搜索与外部搜索引擎跳转
- 天气、时间、日期等小组件
- 深色/浅色模式

## 目录结构

```text
.
├── App.tsx
├── components/
├── constants.tsx
├── data.json
├── docker-compose.yml
├── Dockerfile
├── index.html
├── index.tsx
├── package.json
├── server.js
├── tsconfig.json
├── types.ts
└── vite.config.ts
```

## 本地开发

安装依赖：

```bash
npm install
```

启动前端开发服务：

```bash
npm run dev
```

启动后端服务：

```bash
npm start
```

生产构建检查：

```bash
npm run build
```

## Docker 部署：直接拉取镜像

服务器需要提前安装：

- Docker
- Docker Compose

已发布镜像：

```text
darkver8/nav:latest
```

镜像摘要：

```text
darkver8/nav@sha256:ea0b8979fe6833b57d31d89c384febd00dd61feca2ea54a207d0e630a188bfff
```

### 方式一：docker run

创建部署目录和数据文件：

```bash
mkdir -p /opt/darks-nav
cd /opt/darks-nav
echo '{ "categories": [] }' > data.json
```

启动容器：

```bash
docker run -d \
  --name darks-nav \
  --restart always \
  -p 9910:3000 \
  -e ADMIN_PASSWORD=你的强密码 \
  -v /opt/darks-nav/data.json:/app/data.json \
  darkver8/nav:latest
```

访问地址：

```text
http://服务器IP:9910
```

### 方式二：docker compose

在 `/opt/darks-nav/docker-compose.yml` 写入：

```yaml
services:
  darks-nav:
    image: darkver8/nav:latest
    container_name: darks-nav
    environment:
      - ADMIN_PASSWORD=${ADMIN_PASSWORD:-666333}
    ports:
      - "9910:3000"
    volumes:
      - ./data.json:/app/data.json
    restart: always
```

创建 `.env` 和 `data.json`：

```bash
cd /opt/darks-nav
echo "ADMIN_PASSWORD=你的强密码" > .env
echo '{ "categories": [] }' > data.json
```

启动：

```bash
docker compose up -d
```

更新镜像：

```bash
docker compose pull
docker compose up -d
```

注意：如果 `data.json` 中已经保存了密码哈希，后续修改 `.env` 里的 `ADMIN_PASSWORD` 不会覆盖现有后台密码。请登录页面后通过“修改后台密码”修改。

## Docker 部署：源码构建

如果你要自己从源码构建镜像，可以使用仓库里的 `Dockerfile` 和 `docker-compose.yml`。

当前 Dockerfile 使用 `docker.1ms.run/node:20-alpine` 作为 Node 镜像源，适合 Docker Hub 访问不稳定的环境。

### 1. 上传项目

推荐部署目录：

```bash
mkdir -p /opt/darks-nav
```

把项目文件上传到 `/opt/darks-nav`。

### 2. 设置管理员密码

在 `/opt/darks-nav/.env` 中设置后台管理员密码：

```bash
ADMIN_PASSWORD=你的强密码
```

注意：不要把 `.env` 提交到公开仓库。

### 3. 初始化数据文件

如果是首次部署，创建空数据文件：

```bash
echo '{ "categories": [] }' > data.json
```

如果是更新部署，请保留原来的 `data.json`，它里面保存了导航数据和当前后台密码哈希。

### 4. 启动服务

```bash
docker compose up -d --build
```

默认端口映射为：

```text
宿主机 9910 -> 容器 3000
```

访问地址：

```text
http://服务器IP:9910
```

## 源码更新部署

更新代码时，建议先备份 `data.json`：

```bash
cp data.json data.json.bak
```

然后上传新代码，确保不要覆盖已有 `data.json`，再执行：

```bash
docker compose up -d --build
```

查看运行状态：

```bash
docker compose ps
```

查看日志：

```bash
docker logs --tail 100 darks-nav
```

## 数据备份与迁移

所有导航数据都在 `data.json`。

备份：

```bash
cp data.json data.json.$(date +%Y%m%d%H%M%S).bak
```

迁移：

1. 在新服务器部署项目。
2. 把旧服务器的 `data.json` 放到新服务器项目目录。
3. 重新执行 `docker compose up -d --build`。

## 常见问题

### 修改密码提示 `Failed to save data`

旧版本后端在 Docker 单文件挂载 `data.json` 时，使用临时文件 `rename` 覆盖可能失败。当前版本已兼容这种情况：优先原子写入，遇到 Docker bind mount 限制时自动退回直接写入。

如果仍然出现，请确认容器内外的 `data.json` 都是文件，不是目录：

```bash
ls -l data.json
docker exec darks-nav ls -l /app/data.json
```

### 报错 `EISDIR: illegal operation on a directory, open 'data.json'`

说明 `data.json` 被创建成了目录。处理方式：

```bash
rm -rf data.json
echo '{ "categories": [] }' > data.json
docker compose up -d --build
```

### 页面能打开，但天气加载慢

天气定位会请求外部 IP 和天气接口。当前后端 `/api/ip` 已设置 3 秒超时，外部接口不可用时前端会降级使用默认城市。

### 后台登录失败

如果 `data.json` 中已经保存了密码哈希，后续修改 `.env` 不会覆盖现有后台密码。请使用页面里的“修改后台密码”功能修改。

如果忘记密码，可以备份后编辑或重置 `data.json` 中的 `adminPassword` 字段，再重启容器。
