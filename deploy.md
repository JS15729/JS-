# 私有学习资料云盘 - 完整部署教程

## 目录

1. [本地部署](#本地部署)
2. [服务器部署 (Linux)](#服务器部署)
3. [初始化管理员账号](#初始化管理员账号)
4. [环境变量配置说明](#环境变量配置说明)
5. [挂载外部硬盘扩容](#挂载外部硬盘扩容)
6. [配置自动备份](#配置自动备份)
7. [使用 PM2 守护进程](#使用-pm2-守护进程)
8. [Nginx 反向代理配置](#nginx-反向代理配置)
9. [HTTPS 证书配置](#https-证书配置)
10. [防火墙配置](#防火墙配置)
11. [常见问题排查](#常见问题排查)

---

## 本地部署

### 环境准备

```bash
# 1. 安装 Node.js (>= 18.x)
# 下载: https://nodejs.org/

# 2. 安装 MongoDB
# Windows: https://www.mongodb.com/try/download/community
# 安装后MongoDB会作为Windows服务自动启动

# 3. 验证安装
node -v   # >= v18.0.0
npm -v    # >= 9.0.0
mongosh --version
```

### 启动项目

```bash
# 1. 进入项目目录
cd private-cloud-storage

# 2. 安装后端依赖并启动
cd server
npm install
npm run dev
# 后端启动在 http://localhost:3000

# 3. 新开终端，初始化管理员
cd server
npx ts-node src/seed.ts

# 4. 安装前端依赖并启动
cd ../client
npm install
npm run dev
# 前端启动在 http://localhost:5173

# 5. 访问 http://localhost:5173
# 使用 admin / admin123 登录
```

---

## 服务器部署

### 目标服务器要求

- **系统**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **CPU**: 2核心以上
- **内存**: 4GB 以上
- **硬盘**: 根据资料量，建议 100GB+
- **网络**: 公网IP + 开放80/443端口

### Step 1: 安装基础环境

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 MongoDB 7.0
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [arch=amd64,arm64] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# 安装 PM2 (进程守护)
sudo npm install -g pm2

# 安装 Nginx
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 验证
node -v
mongosh --eval "db.version()"
pm2 -v
nginx -v
```

### Step 2: 部署项目代码

```bash
# 创建部署目录
sudo mkdir -p /opt/private-cloud
sudo chown $USER:$USER /opt/private-cloud

# 上传代码到服务器（方式任选其一）
# 方式1: Git
cd /opt/private-cloud
git clone <your-repo-url> .

# 方式2: SCP
# scp -r ./private-cloud-storage/* user@server:/opt/private-cloud/

# 方式3: rsync
# rsync -avz ./private-cloud-storage/ user@server:/opt/private-cloud/
```

### Step 3: 配置并启动后端

```bash
cd /opt/private-cloud/server

# 安装依赖
npm install

# 编译
npm run build

# 配置环境变量
cp .env .env.production
vim .env.production
```

修改生产环境配置：

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/private-cloud-storage
JWT_SECRET=your-random-secret-string-at-least-32-chars
JWT_EXPIRES_IN=7d
UPLOAD_DIR=/data/private-cloud/uploads
BACKUP_DIR=/data/private-cloud/backups
MAX_FILE_SIZE=10737418240
CHUNK_SIZE=5242880
```

```bash
# 创建存储目录
sudo mkdir -p /data/private-cloud/uploads
sudo mkdir -p /data/private-cloud/backups
sudo chown -R $USER:$USER /data/private-cloud

# 初始化管理员账号
npx ts-node src/seed.ts

# 使用 PM2 启动后端
pm2 start dist/main.js --name private-cloud-api
pm2 save
pm2 startup
```

### Step 4: 构建并部署前端

```bash
cd /opt/private-cloud/client

# 安装依赖
npm install

# 修改 API 地址（如果需要）
# 编辑 vite.config.ts 中的 proxy 为实际API地址

# 构建生产版本
npm run build

# 构建产物在 dist/ 目录
# 配置 Nginx 指向此目录
sudo mkdir -p /var/www/private-cloud
sudo cp -r dist/* /var/www/private-cloud/
sudo chown -R www-data:www-data /var/www/private-cloud
```

---

## 初始化管理员账号

```bash
cd /opt/private-cloud/server
npx ts-node src/seed.ts
```

输出示例：
```
正在连接数据库...
数据库连接成功
✓ 管理员账号已创建: admin / admin123
✓ 系统配置已创建: site_name = 私有学习资料云盘
...
初始化完成！
================================
管理员账号: admin
管理员密码: admin123
请登录后立即修改密码！
================================
```

**登录后请立即修改默认密码！**

---

## 环境变量配置说明

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| PORT | 3000 | 后端服务端口 |
| MONGODB_URI | mongodb://localhost:27017/private-cloud-storage | MongoDB连接地址 |
| JWT_SECRET | (必须修改) | JWT签名密钥，生产环境请用随机字符串 |
| JWT_EXPIRES_IN | 7d | Token有效期 |
| UPLOAD_DIR | ./uploads | 文件存储目录 |
| BACKUP_DIR | ./backups | 备份存储目录 |
| MAX_FILE_SIZE | 10737418240 | 最大上传文件大小(字节)，默认10GB |
| CHUNK_SIZE | 5242880 | 分片上传每片大小(字节)，默认5MB |

---

## 挂载外部硬盘扩容

当服务器存储空间不足时，可挂载外部硬盘扩展存储。

### 1. 挂载新硬盘

```bash
# 查看可用磁盘
lsblk
sudo fdisk -l

# 假设新硬盘为 /dev/sdb
# 分区
sudo fdisk /dev/sdb
# 输入: n (新建分区) → p (主分区) → 1 → 回车 → 回车 → w (写入)

# 格式化
sudo mkfs.ext4 /dev/sdb1

# 创建挂载点
sudo mkdir -p /mnt/data-disk

# 挂载
sudo mount /dev/sdb1 /mnt/data-disk

# 设置开机自动挂载
echo '/dev/sdb1 /mnt/data-disk ext4 defaults 0 0' | sudo tee -a /etc/fstab

# 验证
df -h | grep data-disk
```

### 2. 迁移存储数据到新硬盘

```bash
# 停止服务
pm2 stop private-cloud-api

# 迁移现有数据
sudo rsync -avz /data/private-cloud/ /mnt/data-disk/private-cloud/

# 创建软链接
sudo rm -rf /data/private-cloud
sudo ln -s /mnt/data-disk/private-cloud /data/private-cloud

# 重启服务
pm2 start private-cloud-api
```

### 3. 直接修改存储路径

或者直接修改 `.env.production`：

```env
UPLOAD_DIR=/mnt/data-disk/private-cloud/uploads
BACKUP_DIR=/mnt/data-disk/private-cloud/backups
```

重启服务生效：
```bash
pm2 restart private-cloud-api
```

---

## 配置自动备份

系统内置了每日凌晨2点自动备份功能（使用 node-cron）。

### 备份策略

- **自动备份**: 每天凌晨 2:00 自动执行
- **备份内容**: 所有上传的文件（压缩为 .zip）
- **备份位置**: `BACKUP_DIR` 指定目录
- **保留策略**: 自动保留最近 30 天，过期自动清理

### 手动触发备份

管理员登录后进入「系统配置」→ 点击「立即备份」

或通过API调用：
```bash
curl -X POST http://localhost:3000/api/backup/run \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 额外配置云备份（可选）

将备份目录同步到远程服务器：

```bash
# 使用 rsync 同步到远程
rsync -avz /data/private-cloud/backups/ user@backup-server:/backups/private-cloud/

# 设置为每日定时任务
crontab -e
# 添加：0 4 * * * rsync -avz /data/private-cloud/backups/ user@backup-server:/backups/private-cloud/ >> /var/log/backup-sync.log 2>&1
```

---

## 使用 PM2 守护进程

```bash
# 启动
pm2 start dist/main.js --name private-cloud-api --time

# 查看状态
pm2 status

# 查看日志
pm2 logs private-cloud-api

# 重启
pm2 restart private-cloud-api

# 停止
pm2 stop private-cloud-api

# 设置开机自启
pm2 startup
pm2 save

# 监控
pm2 monit
```

### PM2 配置文件（可选）

创建 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: 'private-cloud-api',
    script: './dist/main.js',
    cwd: '/opt/private-cloud/server',
    env: { NODE_ENV: 'production' },
    instances: 2,        // 双实例负载均衡
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: '/var/log/private-cloud/error.log',
    out_file: '/var/log/private-cloud/out.log',
  }]
};
```

使用：
```bash
pm2 start ecosystem.config.js
```

---

## Nginx 反向代理配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    root /var/www/private-cloud;
    index index.html;

    # 前端路由 (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端API代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 大文件上传超时设置
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        client_max_body_size 10240m;
    }
}
```

```bash
# 测试配置
sudo nginx -t

# 重载配置
sudo nginx -s reload
```

---

## HTTPS 证书配置

使用 Let's Encrypt 免费证书：

```bash
# 安装 certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期（已自动配置）
sudo certbot renew --dry-run
```

---

## 防火墙配置

```bash
# 使用 ufw
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable

# 如果使用其他端口
sudo ufw allow 3000  # API (如果不通过Nginx代理)

# 查看状态
sudo ufw status
```

---

## 常见问题排查

### MongoDB 连接失败

```bash
# 检查 MongoDB 运行状态
sudo systemctl status mongod

# 查看 MongoDB 日志
sudo tail -f /var/log/mongodb/mongod.log

# 如果未启动
sudo systemctl start mongod
```

### 端口被占用

```bash
# 查看端口占用
lsof -i :3000
sudo netstat -tlnp | grep 3000

# 杀死占用进程
kill -9 <PID>
```

### 上传大文件失败

- 检查 Nginx `client_max_body_size` 配置
- 检查 `.env` 中 `MAX_FILE_SIZE` 设置
- 检查磁盘剩余空间

### 存储空间不足

```bash
# 查看磁盘使用
df -h
du -sh /data/private-cloud/uploads/*

# 清理备份
ls -lh /data/private-cloud/backups/
rm /data/private-cloud/backups/old-backup.zip
```

### 忘记管理员密码

```bash
cd /opt/private-cloud/server
npx ts-node -e "
const bcrypt = require('bcryptjs');
console.log(bcrypt.hashSync('newpassword', 12));
"

# 然后用 mongo shell 更新密码
mongosh
> use private-cloud-storage
> db.users.updateOne({username:'admin'}, {\$set:{password:'<上面生成的hash>'}})
```

### 性能优化建议

1. **MongoDB 索引**: 系统已内置基本索引，无需额外操作
2. **增加 Node.js 实例**: 在 `ecosystem.config.js` 中增加 `instances` 数量
3. **使用 SSD**: 文件存储使用 SSD 硬盘可大幅提升读写速度
4. **CDN 加速**: 如需公网访问，可配置 CDN 代理静态资源
5. **定期清理**: 每月检查并清理回收站和过期备份
