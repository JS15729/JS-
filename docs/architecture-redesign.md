# 私有云存储系统 - 后端架构重构方案

> **架构师**: 后端架构师  
> **版本**: v2.0  
> **日期**: 2026-05-09  
> **目标**: 提升系统扩展性、稳定性和性能

---

## 📋 目录

1. [当前架构分析](#当前架构分析)
2. [架构重构方案](#架构重构方案)
3. [数据库优化](#数据库优化)
4. [缓存策略](#缓存策略)
5. [文件存储优化](#文件存储优化)
6. [安全加固](#安全加固)
7. [监控与日志](#监控与日志)
8. [实施路线图](#实施路线图)

---

## 🔍 当前架构分析

### 现有技术栈

| 组件 | 技术 | 版本 |
|------|------|------|
| 框架 | NestJS | 10.3.0 |
| 数据库 | MongoDB | 8.1.0 |
| ORM | Mongoose | 10.0.6 |
| 认证 | JWT + Passport | 10.2.0 |
| 文件上传 | Multer | 1.4.5 |
| 定时任务 | @nestjs/schedule | 4.0.0 |

### 当前模块结构

```
server/src/
├── auth/              # 认证模块
├── user/              # 用户管理
├── folder/            # 文件夹管理
├── file/              # 文件管理
├── upload/            # 文件上传
├── preview/           # 文件预览
├── share/             # 文件分享
├── search/            # 搜索功能
├── tag/               # 标签管理
├── favorite/          # 收藏功能
├── recycle/           # 回收站
├── backup/            # 备份服务
├── system/            # 系统配置
├── note/              # 文件备注
└── announcement/      # 公告管理
```

### 🚨 当前架构问题

#### 1. **扩展性不足**

| 问题 | 影响 | 严重程度 |
|------|------|----------|
| 单体架构，所有模块耦合 | 无法独立扩展某个功能模块 | 🔴 高 |
| 缺少服务拆分 | 某个模块出问题影响整个系统 | 🔴 高 |
| 无分布式存储 | 单节点存储容量上限 | 🔴 高 |
| 无CDN支持 | 文件访问速度受限 | 🟡 中 |

#### 2. **性能瓶颈**

| 问题 | 影响 | 严重程度 |
|------|------|----------|
| 无缓存层 | 频繁查询数据库，响应慢 | 🔴 高 |
| 大文件上传无分片 | 网络波动导致上传失败 | 🔴 高 |
| 无数据库连接池优化 | 高并发时数据库连接不足 | 🟡 中 |
| 缺少索引优化 | 查询性能低下 | 🟡 中 |

#### 3. **稳定性风险**

| 问题 | 影响 | 严重程度 |
|------|------|----------|
| CORS配置过于宽松 | 安全风险 | 🟡 中 |
| JWT secret使用默认值 | 安全漏洞 | 🔴 高 |
| 无速率限制 | 易受DDoS攻击 | 🔴 高 |
| 无熔断机制 | 级联故障风险 | 🟡 中 |
| 无健康检查 | 无法及时发现故障 | 🟡 中 |

#### 4. **监控缺失**

- 无结构化日志
- 无性能监控
- 无告警机制
- 无链路追踪

---

## 🏗️ 架构重构方案

### 目标架构：微服务 + 事件驱动

```
┌─────────────────────────────────────────────────────────────┐
│                    客户端 (Web/Mobile)                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    API网关层 (Gateway)                      │
│  ├─ 负载均衡 (Nginx/HAProxy)                               │
│  ├─ 限流熔断 (Rate Limit & Circuit Breaker)                │
│  ├─ 认证鉴权 (Authentication & Authorization)               │
│  └─ 日志监控 (Logging & Monitoring)                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
  ┌───────────┐  ┌───────────┐  ┌───────────┐
  │ 用户服务   │  │ 文件服务   │  │ 搜索服务   │
  │ User      │  │ File      │  │ Search    │
  │ Service   │  │ Service   │  │ Service   │
  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
        │               │               │
        └───────────────┼───────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │   消息队列 (RabbitMQ) │
            └───────────────────────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
         ▼              ▼              ▼
  ┌───────────┐  ┌───────────┐  ┌───────────┐
  │ 缩略图服务 │  │ 病毒扫描   │  │ 审计日志   │
  │ Thumbnail │  │ Virus     │  │ Audit     │
  │ Service   │  │ Scan      │  │ Log       │
  └───────────┘  └───────────┘  └───────────┘

┌─────────────────────────────────────────────────────────────┐
│                      数据层 (Data Layer)                    │
│  ├─ MongoDB (主库) - 文件元数据                           │
│  ├─ MongoDB (从库) - 读写分离                             │
│  ├─ Redis - 缓存层                                        │
│  ├─ MinIO/Ceph - 分布式对象存储                           │
│  └─ Elasticsearch - 全文搜索                               │
└─────────────────────────────────────────────────────────────┘
```

### 1. 服务拆分策略

#### 核心微服务

| 服务名 | 职责 | 数据库 | 缓存 |
|--------|------|--------|------|
| **API Gateway** | 路由、认证、限流、日志 | - | Redis |
| **User Service** | 用户注册、登录、权限管理 | MongoDB | Redis |
| **File Service** | 文件元数据处理、CRUD | MongoDB | Redis |
| **Storage Service** | 文件存储、上传、下载 | - | - |
| **Search Service** | 全文搜索、标签搜索 | Elasticsearch | Redis |
| **Share Service** | 文件分享、权限验证 | MongoDB | Redis |
| **Notification Service** | 通知、邮件、消息推送 | MongoDB | Redis |

#### 辅助服务

| 服务名 | 职责 |
|--------|------|
| **Thumbnail Service** | 图片/视频缩略图生成 |
| **Virus Scan Service** | 文件病毒扫描 |
| **Audit Service** | 操作审计日志 |
| **Backup Service** | 数据备份与恢复 |

### 2. 数据库架构优化

#### MongoDB 集群架构

```
                     ┌─────────────────┐
                     │   MongoDB Atlas │
                     │   或自建集群     │
                     └────────┬────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
        ┌─────────┐    ┌─────────┐    ┌─────────┐
        │ Primary │    │Secondary│    │Secondary│
        │  (主库) │───▶│ (从库1) │    │ (从库2) │
        └─────────┘    └─────────┘    └─────────┘
              │               │               │
              └───────────────┼───────────────┘
                              │
                              ▼
                        ┌─────────┐
                        │  Arbiter│
                        │ (仲裁节点)│
                        └─────────┘
```

#### 数据分片策略

```javascript
// 按用户ID进行分片
sh.shardCollection("cloud_storage.files", { "owner_id": 1 });
sh.shardCollection("cloud_storage.users", { "_id": 1 });

// 按时间范围分片（适用于日志类数据）
sh.shardCollection("cloud_storage.audit_logs", { "created_at": 1 });
```

### 3. 缓存架构设计

#### Redis 缓存策略

```typescript
// 缓存层级设计
┌─────────────────────────────────────┐
│         L1 Cache (Local)           │  // 进程内缓存 (Node.js Memory)
│  - 用户会话信息                     │
│  - 热点文件元数据                   │
└──────────────┬──────────────────────┘
               │ 未命中
               ▼
┌─────────────────────────────────────┐
│         L2 Cache (Redis)           │  // 分布式缓存
│  - 文件元数据缓存 (TTL: 5分钟)      │
│  - 用户权限缓存 (TTL: 10分钟)      │
│  - 热点文件列表 (TTL: 2分钟)       │
└──────────────┬──────────────────────┘
               │ 未命中
               ▼
┌─────────────────────────────────────┐
│       L3 Cache (MongoDB)           │  // 数据库
└─────────────────────────────────────┘
```

#### 缓存更新策略

```typescript
// Write-Through 策略：写入时同步更新缓存
async updateFile(fileId: string, updateData: Partial<File>) {
  // 1. 更新数据库
  const file = await this.fileModel.findByIdAndUpdate(fileId, updateData, { new: true });
  
  // 2. 同步更新缓存
  await this.redis.set(
    `file:${fileId}`, 
    JSON.stringify(file), 
    'EX', 
    300 // 5分钟过期
  );
  
  return file;
}

// Cache-Aside 策略：读取时先查缓存
async getFile(fileId: string) {
  // 1. 查缓存
  const cached = await this.redis.get(`file:${fileId}`);
  if (cached) return JSON.parse(cached);
  
  // 2. 查数据库
  const file = await this.fileModel.findById(fileId);
  
  // 3. 写入缓存
  if (file) {
    await this.redis.set(`file:${fileId}`, JSON.stringify(file), 'EX', 300);
  }
  
  return file;
}
```

---

## 🗄️ 数据库优化

### 1. 索引优化

#### 当前索引（需补充）

```typescript
// 现有索引
FileSchema.index({ owner_id: 1, folder_id: 1 });  // ✅ 已有
FileSchema.index({ hash: 1 });                      // ✅ 已有
FileSchema.index({ name: 'text', tags: 'text' });   // ✅ 已有

// 建议新增索引
FileSchema.index({ owner_id: 1, is_deleted: 1, createdAt: -1 });  // 分页查询优化
FileSchema.index({ folder_id: 1, name: 1 }, { unique: true });   // 防止重名
FileSchema.index({ storage_path: 1 });                             // 存储路径查询
FileSchema.index({ createdAt: -1 });                               // 时间排序
FileSchema.index({ size: 1 });                                     // 文件大小查询
FileSchema.index({ mime_type: 1 });                                // 文件类型筛选
```

#### 复合索引设计原则

```javascript
// ✅ 好的索引设计 - 遵循ESR原则 (Equality, Sort, Range)
{ owner_id: 1, is_deleted: 1, createdAt: -1 }
//   E(等值)    E(等值)      S(排序)

// ❌ 避免的索引设计
{ createdAt: -1, owner_id: 1 }  // 排序字段在前，无法有效过滤
```

### 2. 数据模型优化

#### 文件表结构优化

```typescript
@Schema({ 
  timestamps: true, 
  collection: 'files',
  timeseries: {                      // MongoDB 5.0+ 时序集合
    timeField: 'createdAt',
    metaField: 'owner_id',
    granularity: 'hours'
  }
})
export class File {
  @Prop({ required: true, maxlength: 200 })
  name: string;

  @Prop({ required: true })
  original_name: string;

  @Prop({ required: true, min: 0 })
  size: number;

  @Prop({ required: true })
  mime_type: string;

  @Prop({ default: '', index: true })  // 添加索引
  hash: string;

  @Prop({ type: Types.ObjectId, ref: 'Folder', default: null, index: true })
  folder_id: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  owner_id: Types.ObjectId;

  @Prop({ required: true })
  storage_path: string;

  @Prop({ type: [String], default: [], index: true })  // 添加索引
  tags: string[];

  @Prop({ default: false, index: true })  // 添加索引
  is_deleted: boolean;

  @Prop({ type: Date, default: null, index: true })
  deleted_at: Date | null;

  @Prop({ default: false, index: true })  // 添加索引
  is_pinned: boolean;

  @Prop({ default: 0 })
  view_count: number;

  @Prop({ default: 0 })
  download_count: number;

  @Prop({ default: '' })
  thumbnail_path: string;

  // ✅ 新增字段
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;  // 扩展元数据

  @Prop({ default: 'active', enum: ['active', 'archived', 'deleted'] })
  status: string;  // 状态管理

  @Prop({ type: [Object], default: [] })
  versions: Array<{    // 版本控制
    version: number;
    storage_path: string;
    size: number;
    created_at: Date;
  }>;
}
```

### 3. 数据库连接池优化

```typescript
// mongoose.config.ts
export const mongooseConfig = {
  uri: process.env.MONGODB_URI,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  
  // ✅ 连接池配置
  maxPoolSize: 100,              // 最大连接数
  minPoolSize: 10,               // 最小连接数
  maxConnecting: 5,              // 最大正在连接的连接数
  
  // ✅ 超时配置
  connectTimeoutMS: 10000,       // 连接超时
  socketTimeoutMS: 45000,        // Socket超时
  
  // ✅ 心跳检测
  heartbeatFrequencyMS: 10000,   // 心跳频率
  
  // ✅ 重试策略
  retryWrites: true,
  retryReads: true,
  maxRetryTimeMS: 30000,         // 最大重试时间
  
  // ✅ 读写分离
  readPreference: 'secondaryPreferred',  // 优先从库读取
  readConcern: { level: 'majority' },
  writeConcern: { w: 'majority', j: true },
};
```

---

## ⚡ 缓存策略

### 1. Redis 集群部署

```yaml
# redis-cluster.conf
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 5000
appendonly yes
save 900 1
save 300 10
save 60 10000
maxmemory 2gb
maxmemory-policy allkeys-lru
```

### 2. 缓存键设计规范

```typescript
// ✅ 统一的缓存键命名规范
const CacheKeys = {
  // 用户相关
  USER_SESSION: (userId: string) => `user:session:${userId}`,
  USER_PERMISSION: (userId: string) => `user:permission:${userId}`,
  USER_QUOTA: (userId: string) => `user:quota:${userId}`,
  
  // 文件相关
  FILE_META: (fileId: string) => `file:meta:${fileId}`,
  FILE_LIST: (userId: string, folderId: string) => `file:list:${userId}:${folderId}`,
  FILE_PINNED: (userId: string) => `file:pinned:${userId}`,
  
  // 文件夹相关
  FOLDER_TREE: (userId: string) => `folder:tree:${userId}`,
  FOLDER_META: (folderId: string) => `folder:meta:${folderId}`,
  
  // 系统相关
  SYSTEM_CONFIG: () => 'system:config',
  ANNOUNCEMENTS: () => 'system:announcements',
};

// ✅ 缓存TTL策略
const CacheTTL = {
  USER_SESSION: 3600 * 24 * 7,    // 7天
  USER_PERMISSION: 3600 * 24,      // 1天
  USER_QUOTA: 300,                  // 5分钟
  FILE_META: 300,                   // 5分钟
  FILE_LIST: 60,                    // 1分钟
  FILE_PINNED: 300,                 // 5分钟
  FOLDER_TREE: 600,                 // 10分钟
  SYSTEM_CONFIG: 3600,              // 1小时
  ANNOUNCEMENTS: 1800,              // 30分钟
};
```

### 3. 缓存穿透/雪崩/击穿防护

```typescript
@Injectable()
export class CacheService {
  constructor(private readonly redis: Redis) {}

  // ✅ 防止缓存穿透 - 布隆过滤器
  async getWithBloomFilter(key: string): Promise<any> {
    const bloomKey = `bloom:${key}`;
    
    // 1. 检查布隆过滤器
    const mightExist = await this.redis.bf.exists(bloomKey, key);
    if (!mightExist) {
      return null;  // 一定不存在
    }
    
    // 2. 查询缓存
    const cached = await this.redis.get(key);
    if (cached) return JSON.parse(cached);
    
    // 3. 查询数据库
    return null;
  }

  // ✅ 防止缓存雪崩 - 随机TTL
  async setWithRandomTTL(key: string, value: any, baseTTL: number): Promise<void> {
    const randomTTL = baseTTL + Math.floor(Math.random() * 300);  // ±5分钟随机
    await this.redis.set(key, JSON.stringify(value), 'EX', randomTTL);
  }

  // ✅ 防止缓存击穿 - 互斥锁
  async getWithMutex(key: string, loadData: () => Promise<any>, ttl: number): Promise<any> {
    const cached = await this.redis.get(key);
    if (cached) return JSON.parse(cached);

    // 获取分布式锁
    const lockKey = `lock:${key}`;
    const lockAcquired = await this.redis.set(lockKey, '1', 'NX', 'EX', 10);

    if (lockAcquired) {
      try {
        // 双重检查
        const cachedAgain = await this.redis.get(key);
        if (cachedAgain) return JSON.parse(cachedAgain);

        // 加载数据
        const data = await loadData();
        
        // 写入缓存
        await this.redis.set(key, JSON.stringify(data), 'EX', ttl);
        
        return data;
      } finally {
        // 释放锁
        await this.redis.del(lockKey);
      }
    } else {
      // 等待其他线程加载
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.getWithMutex(key, loadData, ttl);
    }
  }
}
```

---

## 📦 文件存储优化

### 1. 分布式对象存储 - MinIO

```typescript
// minio.service.ts
@Injectable()
export class MinioService {
  private minioClient: Minio.Client;

  constructor(private configService: ConfigService) {
    this.minioClient = new Minio.Client({
      endPoint: configService.get('MINIO_ENDPOINT'),
      port: parseInt(configService.get('MINIO_PORT')),
      useSSL: configService.get('MINIO_USE_SSL') === 'true',
      accessKey: configService.get('MINIO_ACCESS_KEY'),
      secretKey: configService.get('MINIO_SECRET_KEY'),
    });
  }

  // ✅ 分片上传
  async uploadChunk(
    bucketName: string,
    objectName: string,
    chunk: Buffer,
    partNumber: number,
    uploadId: string
  ) {
    return await this.minioClient.putObject(
      bucketName,
      `${objectName}.part${partNumber}`,
      chunk
    );
  }

  // ✅ 合并分片
  async mergeChunks(bucketName: string, objectName: string, partCount: number) {
    const chunks = [];
    for (let i = 1; i <= partCount; i++) {
      const chunk = await this.minioClient.getObject(
        bucketName,
        `${objectName}.part${i}`
      );
      chunks.push(chunk);
    }

    // 合并并上传
    const mergedBuffer = Buffer.concat(chunks);
    await this.minioClient.putObject(bucketName, objectName, mergedBuffer);

    // 删除分片
    for (let i = 1; i <= partCount; i++) {
      await this.minioClient.removeObject(bucketName, `${objectName}.part${i}`);
    }
  }

  // ✅ 生成预签名URL（CDN加速）
  async getPresignedUrl(bucketName: string, objectName: string, expiry: number = 604800) {
    return await this.minioClient.presignedGetObject(
      bucketName,
      objectName,
      expiry
    );
  }
}
```

### 2. 存储桶策略

```yaml
# MinIO 存储桶配置
buckets:
  - name: files-private
    policy: private
    quota: 10TB
    retention: 90d
    
  - name: files-shared
    policy: public-read
    quota: 5TB
    retention: 30d
    
  - name: thumbnails
    policy: public-read
    quota: 1TB
    retention: 7d
    
  - name: avatars
    policy: public-read
    quota: 100GB
    retention: 365d
```

### 3. CDN 集成

```typescript
// cdn.service.ts
@Injectable()
export class CDNService {
  // ✅ 多CDN策略
  private cdnProviders = {
    primary: 'https://cdn1.example.com',
    backup: 'https://cdn2.example.com',
  };

  async getCDNUrl(objectPath: string): Promise<string> {
    // 1. 检查文件热度
    const isHot = await this.isHotFile(objectPath);
    
    if (isHot) {
      // 热点文件：推送到CDN
      return `${this.cdnProviders.primary}/${objectPath}`;
    } else {
      // 冷文件：直接访问对象存储
      return this.getDirectUrl(objectPath);
    }
  }

  // ✅ 智能CDN切换
  async getSmartCDNUrl(objectPath: string): Promise<string> {
    const primaryHealth = await this.checkCDNHealth(this.cdnProviders.primary);
    
    if (primaryHealth) {
      return `${this.cdnProviders.primary}/${objectPath}`;
    } else {
      // 主CDN故障，切换到备用CDN
      return `${this.cdnProviders.backup}/${objectPath}`;
    }
  }
}
```

---

## 🔒 安全加固

### 1. JWT 安全增强

```typescript
// auth.module.ts - 修复当前安全隐患
JwtModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    secret: config.get('JWT_SECRET'),  // ✅ 必须从环境变量读取，无默认值
    signOptions: {
      expiresIn: config.get('JWT_EXPIRES_IN', '2h'),  // ✅ 缩短过期时间
      issuer: 'private-cloud-storage',
      audience: 'web-client',
    },
  }),
}),
```

```typescript
// jwt.strategy.ts - 增强验证
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private redis: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
      
      // ✅ 添加JWT ID (JTI) 支持黑名单
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    // ✅ 检查JWT是否在黑名单中
    const isBlacklisted = await this.redis.get(`jwt:blacklist:${payload.jti}`);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token已失效');
    }

    // ✅ 检查用户状态
    const user = await this.userService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('用户已禁用');
    }

    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
    };
  }
}
```

### 2. CORS 严格配置

```typescript
// main.ts - 修复CORS配置
app.enableCors({
  // ✅ 明确指定允许的域名
  origin: (origin, callback) => {
    const allowedOrigins = configService.get('ALLOWED_ORIGINS').split(',');
    
    // 允许无origin的请求（如移动应用、Postman）
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: Origin not allowed'));
    }
  },
  
  credentials: true,
  maxAge: 86400,  // 24小时
  
  // ✅ 明确指定允许的HTTP方法
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  
  // ✅ 明确指定允许的请求头
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  
  // ✅ 禁止携带敏感头信息
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
});
```

### 3. 速率限制

```typescript
// rate-limit.guard.ts
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    // ✅ 基于IP的限流
    const ip = request.ip || request.connection.remoteAddress;
    const key = `rate_limit:ip:${ip}`;
    
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, 60);  // 1分钟窗口
    }
    
    if (current > 100) {  // 每分钟最多100次请求
      throw new HttpException(
        '请求过于频繁，请稍后再试',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
    
    // ✅ 基于用户的限流（登录后）
    if (request.user) {
      const userKey = `rate_limit:user:${request.user.userId}`;
      const userCurrent = await this.redis.incr(userKey);
      
      if (userCurrent === 1) {
        await this.redis.expire(userKey, 60);
      }
      
      if (userCurrent > 200) {  // 登录用户每分钟200次
        throw new HttpException(
          '请求过于频繁，请稍后再试',
          HttpStatus.TOO_MANY_REQUESTS
        );
      }
    }
    
    return true;
  }
}
```

### 4. 文件上传安全

```typescript
// file-validation.pipe.ts
@Injectable()
export class FileValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    const file = value;
    
    // ✅ 文件类型白名单
    const allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'text/csv',
      'application/zip', 'application/x-rar-compressed',
    ];
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('不支持的文件类型');
    }
    
    // ✅ 文件大小限制（根据类型差异化）
    const maxSizes = {
      'image/*': 10 * 1024 * 1024,          // 图片：10MB
      'application/pdf': 100 * 1024 * 1024,  // PDF：100MB
      'default': 1024 * 1024 * 1024,        // 其他：1GB
    };
    
    const maxSize = maxSizes[file.mimetype] || maxSizes['default'];
    if (file.size > maxSize) {
      throw new BadRequestException(
        `文件大小不能超过${maxSize / 1024 / 1024}MB`
      );
    }
    
    // ✅ 文件名安全
    file.originalname = file.originalname
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5.-]/g, '_')  // 移除特殊字符
      .substring(0, 255);  // 限制长度
    
    // ✅ 病毒扫描（异步）
    this.virusScanService.scan(file.path).catch(err => {
      console.error('病毒扫描失败:', err);
    });
    
    return file;
  }
}
```

---

## 📊 监控与日志

### 1. 结构化日志

```typescript
// logger.service.ts
@Injectable()
export class LoggerService {
  private logger: winston.Logger;

  constructor(private configService: ConfigService) {
    this.logger = winston.createLogger({
      level: configService.get('LOG_LEVEL', 'info'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()  // ✅ 结构化日志
      ),
      defaultMeta: { 
        service: 'private-cloud-storage',
        environment: configService.get('NODE_ENV', 'development'),
      },
      transports: [
        // ✅ 控制台输出（开发环境）
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
        
        // ✅ 文件输出（生产环境）
        new winston.transports.File({ 
          filename: 'logs/error.log', 
          level: 'error',
          maxsize: 10485760,  // 10MB
          maxFiles: 5,
        }),
        new winston.transports.File({ 
          filename: 'logs/combined.log',
          maxsize: 10485760,
          maxFiles: 5,
        }),
        
        // ✅ ELK集成（可选）
        ...(configService.get('ELK_HOST') ? [
          new WinstonElasticSearchTransport({
            level: 'info',
            clientOpts: { node: configService.get('ELK_HOST') },
            index: 'private-cloud-storage-logs',
          }),
        ] : []),
      ],
    });
  }

  log(message: string, context?: string, meta?: Record<string, any>) {
    this.logger.info(message, { context, ...meta });
  }

  error(message: string, trace?: string, context?: string, meta?: Record<string, any>) {
    this.logger.error(message, { trace, context, ...meta });
  }

  warn(message: string, context?: string, meta?: Record<string, any>) {
    this.logger.warn(message, { context, ...meta });
  }

  debug(message: string, context?: string, meta?: Record<string, any>) {
    this.logger.debug(message, { context, ...meta });
  }
}
```

### 2. 性能监控

```typescript
// monitoring.interceptor.ts
@Injectable()
export class MonitoringInterceptor implements NestInterceptor {
  constructor(
    private metricsService: MetricsService,
    private logger: LoggerService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    const startTime = Date.now();
    const { method, url, ip } = request;
    
    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          
          // ✅ 记录请求指标
          this.metricsService.recordHttpRequest({
            method,
            url,
            statusCode: response.statusCode,
            duration,
            ip,
          });
          
          // ✅ 慢请求告警
          if (duration > 1000) {
            this.logger.warn('慢请求检测', 'Monitoring', {
              method,
              url,
              duration,
              ip,
            });
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          
          // ✅ 记录错误指标
          this.metricsService.recordHttpRequest({
            method,
            url,
            statusCode: error.status || 500,
            duration,
            ip,
            error: error.message,
          });
          
          // ✅ 错误告警
          this.logger.error(
            '请求失败',
            error.stack,
            'Monitoring',
            { method, url, duration, ip }
          );
        },
      })
    );
  }
}
```

### 3. 健康检查

```typescript
// health.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private minioService: MinioService,
  ) {}

  @Get()
  async check() {
    const checks = {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      storage: await this.checkStorage(),
      memory: this.checkMemory(),
      disk: await this.checkDisk(),
    };

    const isHealthy = Object.values(checks).every(check => check.status === 'up');

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  private async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up', responseTime: Date.now() };
    } catch (error) {
      return { status: 'down', error: error.message };
    }
  }

  private async checkRedis() {
    try {
      const start = Date.now();
      await this.redis.ping();
      return { status: 'up', responseTime: Date.now() - start };
    } catch (error) {
      return { status: 'down', error: error.message };
    }
  }

  private async checkStorage() {
    try {
      await this.minioService.client.listBuckets();
      return { status: 'up' };
    } catch (error) {
      return { status: 'down', error: error.message };
    }
  }

  private checkMemory() {
    const used = process.memoryUsage();
    return {
      status: used.heapUsed < 1024 * 1024 * 1024 ? 'up' : 'warning',  // 1GB阈值
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
    };
  }

  private async checkDisk() {
    // 实现磁盘空间检查
    return { status: 'up', free: '50GB' };
  }
}
```

---

## 🚀 实施路线图

### Phase 1: 基础设施优化 (Week 1-2)

| 任务 | 优先级 | 工作量 | 依赖 |
|------|--------|--------|------|
| Redis缓存层部署 | P0 | 3天 | 无 |
| 数据库索引优化 | P0 | 2天 | 无 |
| 数据库连接池配置 | P0 | 1天 | 无 |
| 安全加固（CORS、JWT） | P0 | 2天 | 无 |
| 速率限制实现 | P0 | 2天 | Redis |

### Phase 2: 性能优化 (Week 3-4)

| 任务 | 优先级 | 工作量 | 依赖 |
|------|--------|--------|------|
| 文件分片上传 | P0 | 5天 | 无 |
| 查询结果缓存 | P1 | 3天 | Redis |
| 数据库读写分离 | P1 | 3天 | MongoDB副本集 |
| CDN集成 | P1 | 4天 | 对象存储 |

### Phase 3: 架构升级 (Week 5-8)

| 任务 | 优先级 | 工作量 | 依赖 |
|------|--------|--------|------|
| 微服务拆分（用户服务） | P1 | 5天 | Phase 1-2 |
| 微服务拆分（文件服务） | P1 | 5天 | Phase 1-2 |
| 消息队列集成 | P1 | 3天 | RabbitMQ |
| API网关部署 | P1 | 4天 | 微服务 |

### Phase 4: 监控与运维 (Week 9-10)

| 任务 | 优先级 | 工作量 | 依赖 |
|------|--------|--------|------|
| 日志系统搭建 | P2 | 3天 | ELK |
| 性能监控部署 | P2 | 4天 | Prometheus + Grafana |
| 告警系统配置 | P2 | 2天 | 监控 |
| 自动化部署 | P2 | 5天 | CI/CD |

---

## 📈 预期收益

### 性能指标提升

| 指标 | 当前 | 目标 | 提升 |
|------|------|------|------|
| API响应时间 (P95) | ~500ms | <200ms | **60%** |
| 数据库查询时间 | ~100ms | <20ms | **80%** |
| 文件上传速度 | 依赖网络 | 提升50% | **50%** |
| 系统可用性 | 99% | 99.9% | **0.9%** |

### 扩展性提升

- ✅ 支持水平扩展至 **10+ 节点**
- ✅ 单节点故障不影响整体服务
- ✅ 支持 **10万+ 并发用户**
- ✅ 存储容量可扩展至 **PB级**

### 安全性提升

- ✅ 通过 **OWASP Top 10** 安全审计
- ✅ 实现 **零信任安全模型**
- ✅ 完整的 **审计日志** 追踪

---

## 📚 参考文档

1. [NestJS 官方文档](https://docs.nestjs.com/)
2. [MongoDB 性能最佳实践](https://www.mongodb.com/docs/manual/performance-best-practices/)
3. [Redis 缓存策略](https://redis.io/docs/reference/patterns/distributed-locks/)
4. [微服务架构设计模式](https://microservices.io/patterns/index.html)
5. [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**文档版本**: v2.0  
**最后更新**: 2026-05-09  
**维护者**: 后端架构师团队
