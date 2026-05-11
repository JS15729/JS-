# 私有学习资料云盘存储系统

企业级永久私有学习资料云盘，基于 Node.js + Vue3 全栈开发。

## 技术架构

| 层级 | 技术栈 |
|------|--------|
| 后端框架 | NestJS + TypeScript |
| 前端框架 | Vue3 + Element Plus + Vite |
| 数据库 | MongoDB 7.x |
| 文件存储 | 本地磁盘落地存储 |
| 认证 | JWT (JSON Web Token) |
| 自动备份 | node-cron + archiver (zip压缩) |

## 核心功能

### 文件管理
- 树形文件夹无限层级管理
- 任意格式文件上传（支持大文件分片断点续传）
- 批量文件夹拖拽上传
- 文件置顶、移动、重命名
- 回收站软删除 + 文件恢复

### 在线预览
- PDF 在线预览（浏览器原生）
- Word/Excel/PPT 预览（转PDF）
- Markdown 渲染预览
- 代码高亮预览(30+语言)
- 图片/视频/音频 原生播放
- 支持 Range 请求（视频拖动）

### 权限安全
- 管理员/普通用户 角色分离
- JWT Token 鉴权
- 账号封禁/解封管理
- 文件夹加密密码保护
- 文件哈希去重存储

### 学习资料专属
- 自定义标签分类
- 全文模糊检索
- 文件收藏夹
- 文件备注笔记
- 置顶重要文档

### 分享功能
- 生成永久/限时分享链接
- 支持提取码保护
- 访客无需登录即可预览下载

### 系统管理
- 管理员后台面板
- 用户管理与封禁
- 系统参数实时配置
- 存储用量统计
- 自动定时备份（每日凌晨2点）
- 手动触发备份

### 用户体验
- 暗黑/亮色双主题切换
- 电脑/手机自适应布局
- 文件网格/列表双视图
- 右键菜单快捷操作

## 项目结构

```
private-cloud-storage/
├── server/                    # NestJS 后端
│   ├── src/
│   │   ├── main.ts           # 应用入口
│   │   ├── app.module.ts     # 根模块
│   │   ├── seed.ts           # 初始化脚本
│   │   ├── common/           # 公共模块(守卫/装饰器/过滤器)
│   │   ├── config/           # 配置模块
│   │   ├── schemas/          # MongoDB 数据模型
│   │   ├── auth/             # 认证模块(JWT)
│   │   ├── user/             # 用户管理
│   │   ├── folder/           # 文件夹管理
│   │   ├── file/             # 文件管理
│   │   ├── upload/           # 分片上传
│   │   ├── preview/          # 在线预览
│   │   ├── share/            # 分享链接
│   │   ├── search/           # 全文搜索
│   │   ├── tag/              # 标签管理
│   │   ├── favorite/         # 收藏夹
│   │   ├── recycle/          # 回收站
│   │   ├── backup/           # 自动备份
│   │   ├── system/           # 系统配置
│   │   └── note/             # 文件备注
│   ├── uploads/              # 文件存储目录
│   ├── backups/              # 备份目录
│   └── package.json
├── client/                    # Vue3 前端
│   ├── src/
│   │   ├── main.ts
│   │   ├── App.vue
│   │   ├── router/           # 路由配置
│   │   ├── stores/           # Pinia 状态管理
│   │   ├── api/              # API 接口封装
│   │   ├── views/            # 页面组件
│   │   ├── components/       # 公共组件
│   │   ├── utils/            # 工具函数
│   │   └── styles/           # 全局样式
│   ├── index.html
│   └── package.json
└── deploy.md                  # 部署教程
```

## 快速启动（本地开发）

### 环境要求

- Node.js >= 18.x
- MongoDB >= 7.x
- npm 或 yarn

### 1. 安装 MongoDB

**Windows:**
下载安装: https://www.mongodb.com/try/download/community

**Linux (Ubuntu):**
```bash
# 导入公钥
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [arch=amd64,arm64] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 2. 启动后端

```bash
cd server
npm install
npm run dev
# 启动在 http://localhost:3000
```

### 3. 初始化管理员账号

```bash
cd server
npx ts-node src/seed.ts
# 管理员账号: admin
# 管理员密码: admin123
```

### 4. 启动前端

```bash
cd client
npm install
npm run dev
# 启动在 http://localhost:5173
```

### 5. 访问系统

打开浏览器访问 `http://localhost:5173`，使用管理员账号登录。

## License

MIT
