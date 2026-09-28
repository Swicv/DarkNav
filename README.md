<img width="1919" height="986" alt="image" src="https://github.com/user-attachments/assets/559901dc-6322-4c73-874d-db9e74868551" />

# Cosmo's Nav

Cosmo's Nav 是一个现代、轻量、高颜值的全端响应式个人导航站。支持**双轨部署**：既能**完全脱离服务器、零成本部署在 Cloudflare Pages (Serverless + KV)** 上，也可以通过 **Docker / Docker Compose** 在个人服务器或 NAS 上私有化部署。

## ✨ 特性

- 🌐 **双轨部署**：完美支持 Cloudflare Pages（Serverless 全托管、全球 CDN 加速、永久免费）与 Docker / 传统服务器部署。
- ⚡ **极速体验**：前端基于 React + Vite 构建，在 Cloudflare 上直接读取边缘地理位置，0ms 延迟定位天气。
- 🌓 **全景暗黑模式**：主界面及全部弹窗（登录、添加/编辑分类与链接、修改密码）深度适配深色/浅色主题。
- 📅 **动态农历与时间组件**：内置轻量零依赖中国农历换算算法，实时展示节气农历月日与指针拟态时钟。
- 🔍 **多引擎与本地搜索**：支持在当前所有分类中实时过滤本地链接，外部搜索（谷歌/必应/百度）新标签页常驻跳转。
- 📦 **书签与配置迁移**：支持导出 JSON 配置备份，支持一键导入浏览器导出的 HTML 书签或 JSON 备份。
- 🛡️ **安全管理员后台**：分类排序、增删改查链接、修改密码，后端与边缘函数统一防篡改。

## 📁 目录结构

```text
.
├── App.tsx                    # 前端主页面逻辑
├── components/                # UI 组件（时钟、天气、日期、搜索栏及各类模态框）
│   ├── AdminModal.tsx
│   ├── CategoryModal.tsx
│   ├── ChangePasswordModal.tsx
│   ├── ClockWidget.tsx
│   ├── DateWidget.tsx
│   ├── EditModal.tsx
│   ├── ExtraWidget.tsx
│   ├── SearchBar.tsx
│   └── WeatherWidget.tsx
├── functions/                 # Cloudflare Pages Functions (Serverless API)
│   └── api/
│       ├── _utils.ts          # 边缘函数鉴权、数据清洗与 CORS
│       ├── data.ts            # GET/POST 导航数据接口（读写 KV）
│       ├── ip.ts              # IP 与位置接口（优先 Cloudflare Edge Geo）
│       └── login.ts           # 管理员登录鉴权接口
├── utils/
│   └── lunar.ts               # 轻量零依赖中国农历计算工具
├── constants.tsx              # 分类默认图标映射及初始常量
├── data.json                  # Docker / 本地模式持久化数据文件
├── docker-compose.yml         # Docker Compose 编排文件
├── Dockerfile                 # 多阶段构建 Docker 镜像定义
├── index.html                 # 页面 HTML 模板
├── index.tsx                  # React 根挂载点
├── package.json               # 项目依赖与构建脚本
├── server.js                  # Docker / Node.js 模式 Express 后端服务
├── tsconfig.json              # TypeScript 编译配置
├── types.ts                   # TypeScript 类型定义
├── vite.config.ts             # Vite 构建与代理配置
└── wrangler.toml              # Cloudflare Pages 配置文件
```

---

## 🚀 部署方式一：Cloudflare Pages 部署（⭐ 强烈推荐：永久免费 / 0 成本）

使用 Cloudflare 部署无需购买任何云服务器，自带全球 Anycast CDN 与 HTTPS，并且享有免费的 KV 数据库配额（每天 10 万次读取 / 1000 次写入，完全满足个人导航站需求）。

### 1. 推送代码到 GitHub
将本项目代码 Fork 或直接推送到你自己的 GitHub 仓库。

### 2. 在 Cloudflare 创建 Pages 项目
1. 登录 [Cloudflare 控制台](https://dash.cloudflare.com/)。
2. 左侧菜单进入 **计算 (Workers 和 Pages)** -> **创建应用程序** -> 选择 **Pages** 选项卡 -> 点击 **连接到 Git**。
3. 授权并选择你的 `Cosmo's Nav` 仓库。
4. 构建配置如下设置：
   - **项目名称**：`cosmos-nav`（可自定义）
   - **生产分支**：`main`
   - **框架预设**：`Vite`
   - **构建命令**：`npm run build`
   - **构建输出目录**：`dist`
5. 点击 **保存并部署**（此时会进行首次构建并生成静态页面）。

### 3. 创建并绑定 KV 数据库（持久化存储）
1. 在 Cloudflare 左侧菜单中，进入 **存储和数据库** -> **KV**。
2. 点击 **创建命名空间**，名称填写 `cosmos-nav-kv`（或任意名称）。
3. 回到刚才创建的 Pages 项目页面，进入 **设置 (Settings)** -> **函数 (Functions)**。
4. 找到 **KV 命名空间绑定 (KV namespace bindings)**，点击 **添加绑定 (Add binding)**：
   - **变量名称 (Variable name)**：必须填写 `NAV_KV`（严格大写）
   - **KV 命名空间**：下拉选择刚才创建的 `cosmos-nav-kv`
5. 点击 **保存**。

### 4. 设置初始管理员密码（可选）
1. 在 Pages 项目的 **设置 (Settings)** -> **环境变量 (Environment variables)** 中。
2. 添加变量：`ADMIN_PASSWORD`，值设置为你的管理员初始密码（如不设置，默认密码为 `666333`）。
3. 保存后，在 **部署 (Deployments)** 页面对最新的一次部署点击 **重新部署 (Retry deployment)** 使绑定生效。

> 🎉 部署完成！访问 Cloudflare 提供的 `*.pages.dev` 域名即可使用。可在 Pages 设置中绑定你的自定义域名。

---

## 🐳 部署方式二：Docker 部署（自建服务器 / NAS）

如果你已有云服务器或家庭 NAS，希望完全在本地网络运行：

### 1. 使用 Docker Compose（推荐）
在服务器部署目录（例如 `/opt/cosmos-nav`）下创建 `docker-compose.yml`：

```yaml
services:
  cosmos-nav:
    build: .
    container_name: cosmos-nav
    environment:
      - ADMIN_PASSWORD=${ADMIN_PASSWORD:-666333}
    ports:
      - "9910:3000"
    volumes:
      - ./data.json:/app/data.json
    restart: always
```

初始化配置文件并启动：

```bash
mkdir -p /opt/cosmos-nav && cd /opt/cosmos-nav
echo '{ "categories": [] }' > data.json
echo "ADMIN_PASSWORD=你的强密码" > .env

# 拉取源码后构建并启动
docker compose up -d --build
```

访问地址：`http://服务器IP:9910`

### 2. 使用预编译镜像直接运行

```bash
mkdir -p /opt/cosmos-nav && cd /opt/cosmos-nav
echo '{ "categories": [] }' > data.json

docker run -d \
  --name cosmos-nav \
  --restart always \
  -p 9910:3000 \
  -e ADMIN_PASSWORD=你的强密码 \
  -v $(pwd)/data.json:/app/data.json \
  darkver8/nav:latest
```

---

## 💻 本地开发

安装依赖：
```bash
npm install
```

启动前端 Vite 开发服务器：
```bash
npm run dev
```

启动后端 Node.js 服务：
```bash
npm start
```

生产打包检查：
```bash
npm run build
```

Cloudflare Pages 本地全栈模拟预览：
```bash
npx wrangler pages dev dist
```

---

## ❓ 常见问题

### 1. Cloudflare 部署后保存链接提示“未绑定 KV”？
请检查 Pages 项目的 **Settings -> Functions -> KV namespace bindings** 中，变量名是否严格为 `NAV_KV`。绑定后请在 **Deployments** 中重新部署一次。

### 2. 天气组件加载慢或定位不准？
- 在 **Cloudflare 模式** 下，边缘节点自动提供秒级精准定位，无需经过外部代理接口。
- 在 **Docker 模式** 下，后端会自动请求 `ip-api.com` 并开启 15 分钟内存缓存，避免重复请求被第三方限频。

### 3. 如何备份与迁移数据？
- **页面内备份**：以管理员身份登录后，左侧菜单底部点击“导出”，可下载带日期的 JSON 备份文件；在新环境中点击“导入”即可一键恢复。
- **Docker 文件备份**：直接备份宿主机上的 `data.json` 即可。
