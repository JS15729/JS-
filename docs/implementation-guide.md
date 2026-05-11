# 私有云存储系统 - 实施指南

> **快速实施建议** - 基于架构重构方案的 actionable 指南

---

## 🎯 快速胜利（Quick Wins）- 本周可完成

### 1. 立即修复的安全漏洞

#### ❌ 当前问题
```typescript
// server/src/auth/auth.module.ts (第30行)
signOptions: {
  expiresIn: config.get('JWT_EXPIRES_IN', '7d'),  // ❌ 7天太长
},
secret: config.get('JWT_SECRET', 'default-secret'),  // ❌ 有默认值是严重漏洞
```

#### ✅ 修复方案
```typescript
// server/src/auth/auth.module.ts
JwtModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const secret = config.get('JWT_SECRET');
    if (!secret || secret === 'default-secret') {
      throw new Error('JWT_SECRET 必须设置，不能使用默认值！');
    }
    
    return {
      secret,
      signOptions: {
        expiresIn: config.get('JWT_EXPIRES_IN', '2h'),  // ✅ 改为2小时
        issuer: 'private-cloud-storage',
        audience: 'web-client',
      },
    };
  },
}),
```

**优先级**: 🔴 P0 - 立即修复  
**工作量**: 30分钟

---

### 2. CORS 配置加固

#### ❌ 当前问题
```typescript
// server/src/main.ts (第17-21行)
app.enableCors({
  origin: true,  // ❌ 允许所有域名，生产环境危险！
  credentials: true,
  maxAge: 86400,
});
```

#### ✅ 修复方案
```typescript
// server/src/main.ts
app.enableCors({
  origin: (origin, callback) => {
    const allowedOrigins = (
      process.env.ALLOWED_ORIGINS || 
      'http://localhost:5173,http://localhost:3000'
    ).split(',');
    
    // 允许无origin的请求（移动应用、Postman等）
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
  maxAge: 86400,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count'],
});
```

**优先级**: 🔴 P0 - 立即修复  
**工作量**: 30分钟

---

### 3. 添加速率限制

#### ✅ 实施方案

**安装依赖**:
```bash
cd server
npm install --save @nestjs/throttler
```

**配置速率限制**:
```typescript
// server/src/app.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    // ✅ 添加速率限制模块
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: 60,              // 60秒窗口
            limit: 100,            // 最多100次请求
            storage: new ThrottlerStorageRedisService(
              config.get('REDIS_URL')
            ),
          },
        ],
      }),
    }),
    // ... 其他模块
  ],
  providers: [
    // ✅ 全局速率限制Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // ... 其他providers
  ],
})
export class AppModule {}
```

**自定义速率限制装饰器**:
```typescript
// server/src/auth/auth.controller.ts
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  // ✅ 登录接口更严格的限制：10分钟内最多5次
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 600 } })
  async login(@Body() loginDto: LoginDto) {
    // ...
  }
  
  // ✅ 注册接口限制：每小时最多3次
  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 3600 } })
  async register(@Body() registerDto: RegisterDto) {
    // ...
  }
}
```

**优先级**: 🔴 P0 - 本周完成  
**工作量**: 2小时

---

## 🗄️ 数据库优化 - 本周完成

### 1. 添加缺失的索引

#### ✅ 实施方案

```typescript
// server/src/schemas/file.schema.ts
@Schema({ timestamps: true, collection: 'files' })
export class File {
  // ... 字段定义
}

export const FileSchema = SchemaFactory.createForClass(File);

// ✅ 现有索引（保留）
FileSchema.index({ owner_id: 1, folder_id: 1 });
FileSchema.index({ hash: 1 });
FileSchema.index({ name: 'text', tags: 'text' });

// ✅ 新增索引（性能优化）
FileSchema.index({ owner_id: 1, is_deleted: 1, createdAt: -1 });  // 分页查询
FileSchema.index({ folder_id: 1, name: 1 }, { unique: false });   // 文件夹内文件列表
FileSchema.index({ owner_id: 1, is_pinned: 1, createdAt: -1 });  // 置顶文件查询
FileSchema.index({ size: 1 });                                     // 文件大小筛选
FileSchema.index({ mime_type: 1 });                                // 文件类型筛选
FileSchema.index({ createdAt: -1 });                               // 时间排序

// ✅ 软删除索引（回收站查询优化）
FileSchema.index({ owner_id: 1, is_deleted: 1, deleted_at: -1 });
```

```typescript
// server/src/schemas/folder.schema.ts
@Schema({ timestamps: true, collection: 'folders' })
export class Folder {
  @Prop({ required: true, maxlength: 100 })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'Folder', default: null })
  parent_id: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  owner_id: Types.ObjectId;

  @Prop({ default: false, index: true })
  is_deleted: boolean;
}

export const FolderSchema = SchemaFactory.createForClass(Folder);

// ✅ 新增索引
FolderSchema.index({ owner_id: 1, parent_id: 1 });           // 查询子文件夹
FolderSchema.index({ owner_id: 1, is_deleted: 1 });          // 回收站查询
FolderSchema.index({ parent_id: 1, name: 1 }, { unique: false });  // 防止同级重名
```

**创建索引脚本**:
```typescript
// server/scripts/create-indexes.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { NestExpressApplication } from '@nestjs/platform-express';

async function createIndexes() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const fileModel = app.get(getModelToken(File.name));
  const folderModel = app.get(getModelToken(Folder.name));
  const userModel = app.get(getModelToken(User.name));

  console.log('开始创建索引...');

  // File 索引
  await fileModel.syncIndexes();
  console.log('✅ File 索引已创建');

  // Folder 索引
  await folderModel.syncIndexes();
  console.log('✅ Folder 索引已创建');

  // User 索引
  await userModel.syncIndexes();
  console.log('✅ User 索引已创建');

  console.log('✅ 所有索引创建完成');
  process.exit(0);
}

createIndexes().catch(err => {
  console.error('❌ 索引创建失败:', err);
  process.exit(1);
});
```

**执行索引创建**:
```bash
cd server
npx ts-node scripts/create-indexes.ts
```

**优先级**: 🔴 P0 - 本周完成  
**工作量**: 2小时  
**性能提升**: 查询速度提升 **50-80%**

---

### 2. 数据库连接池优化

#### ✅ 实施方案

```typescript
// server/src/app.module.ts
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get('MONGODB_URI'),
        
        // ✅ 连接池配置
        maxPoolSize: 100,              // 最大连接数（默认100）
        minPoolSize: 10,               // 最小连接数（默认0）
        maxConnecting: 5,              // 最大正在连接的连接数
        
        // ✅ 超时配置
        connectTimeoutMS: 10000,       // 连接超时10秒
        socketTimeoutMS: 45000,        // Socket超时45秒
        
        // ✅ 心跳检测
        heartbeatFrequencyMS: 10000,   // 每10秒发送一次心跳
        
        // ✅ 重试策略
        retryWrites: true,
        retryReads: true,
        maxRetryTimeMS: 30000,         // 最大重试时间30秒
        
        // ✅ 读写分离
        readPreference: 'secondaryPreferred',  // 优先从库读取
        readConcern: { level: 'majority' },
        writeConcern: { w: 'majority', j: true },
        
        // ✅ 调试日志（生产环境关闭）
        ...(process.env.NODE_ENV === 'development' && {
          debug: true,
        }),
      }),
    }),
    // ... 其他模块
  ],
})
export class AppModule {}
```

**优先级**: 🟡 P1 - 本周完成  
**工作量**: 1小时

---

## ⚡ 缓存层实施 - 下周完成

### 1. Redis 集成

#### 安装依赖
```bash
cd server
npm install --save @nestjs-modules/ioredis ioredis
npm install --save-dev @types/ioredis
```

#### Redis 模块配置
```typescript
// server/src/cache/redis.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '../config/config.module';
import IORedis from 'ioredis';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (config: ConfigService) => {
        const client = new IORedis({
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get('REDIS_PORT', 6379),
          password: config.get('REDIS_PASSWORD'),
          db: config.get('REDIS_DB', 0),
          
          // ✅ 连接池配置
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          
          // ✅ 心跳检测
          keepAlive: 30000,
          
          // ✅ 断开重连
          reconnectOnError: (err) => {
            const targetError = 'READONLY';
            if (err.message.includes(targetError)) {
              return true;
            }
            return false;
          },
        });

        client.on('connect', () => {
          console.log('✅ Redis 连接成功');
        });

        client.on('error', (err) => {
          console.error('❌ Redis 连接失败:', err);
        });

        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
```

#### 缓存服务
```typescript
// server/src/cache/cache.service.ts
import { Injectable, Inject } from '@nestjs/common';
import IORedis from 'ioredis';

@Injectable()
export class CacheService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: IORedis) {}

  // ✅ 获取缓存
  async get(key: string): Promise<any> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  // ✅ 设置缓存
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const stringValue = JSON.stringify(value);
    if (ttl) {
      await this.redis.setex(key, ttl, stringValue);
    } else {
      await this.redis.set(key, stringValue);
    }
  }

  // ✅ 删除缓存
  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  // ✅ 批量删除（支持通配符）
  async delPattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // ✅ 分布式锁
  async acquireLock(key: string, ttl: number = 10): Promise<boolean> {
    const result = await this.redis.set(
      `lock:${key}`,
      '1',
      'NX',
      'EX',
      ttl
    );
    return result === 'OK';
  }

  // ✅ 释放锁
  async releaseLock(key: string): Promise<void> {
    await this.redis.del(`lock:${key}`);
  }
}
```

#### 在文件服务中使用缓存
```typescript
// server/src/file/file.service.ts
import { CacheService } from '../cache/cache.service';

@Injectable()
export class FileService {
  constructor(
    @InjectModel(File.name) private fileModel: Model<FileDocument>,
    private cacheService: CacheService,  // ✅ 注入缓存服务
    // ... 其他依赖
  ) {}

  async findById(id: string, userId?: string) {
    // ✅ 1. 先查缓存
    const cacheKey = `file:${id}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      // 增加浏览次数（异步，不阻塞响应）
      this.incrementViewCount(id).catch(err => {
        console.error('增加浏览次数失败:', err);
      });
      return cached;
    }

    // ✅ 2. 查数据库
    const file = await this.fileModel.findById(id);
    if (!file || file.is_deleted) throw new NotFoundException('文件不存在');

    // ✅ 3. 写入缓存（TTL 5分钟）
    await this.cacheService.set(cacheKey, file.toObject(), 300);

    // 增加浏览次数
    file.view_count = (file.view_count || 0) + 1;
    await file.save();

    return file;
  }

  async update(id: string, userId: string, dto: any) {
    const file = await this.fileModel.findOne({
      _id: id,
      owner_id: new Types.ObjectId(userId),
      is_deleted: false,
    });
    if (!file) throw new NotFoundException('文件不存在');

    // 更新文件
    Object.assign(file, dto);
    await file.save();

    // ✅ 删除缓存，下次查询时重新加载
    await this.cacheService.del(`file:${id}`);

    return file;
  }

  private async incrementViewCount(fileId: string) {
    await this.fileModel.findByIdAndUpdate(fileId, {
      $inc: { view_count: 1 },
    });
  }
}
```

**优先级**: 🟡 P1 - 下周完成  
**工作量**: 1-2天  
**性能提升**: API响应时间提升 **60-80%**

---

## 📦 文件上传优化 - 下下周完成

### 1. 分片上传支持

#### 分片上传接口
```typescript
// server/src/upload/upload.controller.ts
import { Body, Post, Put, Delete, Param, StreamableFile } from '@nestjs/common';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  // ✅ 1. 初始化分片上传
  @Post('init-chunked')
  async initChunkedUpload(@Body() dto: InitChunkedUploadDto) {
    return this.uploadService.initChunkedUpload(dto);
  }

  // ✅ 2. 上传分片
  @Post('chunk/:uploadId')
  @UseInterceptors(FileInterceptor('chunk'))
  async uploadChunk(
    @Param('uploadId') uploadId: string,
    @UploadedFile() chunk: Express.Multer.File,
    @Body() dto: UploadChunkDto,
  ) {
    return this.uploadService.uploadChunk(uploadId, chunk, dto);
  }

  // ✅ 3. 合并分片
  @Post('merge/:uploadId')
  async mergeChunks(@Param('uploadId') uploadId: string) {
    return this.uploadService.mergeChunks(uploadId);
  }

  // ✅ 4. 取消上传（清理分片）
  @Delete('cancel/:uploadId')
  async cancelUpload(@Param('uploadId') uploadId: string) {
    return this.uploadService.cancelUpload(uploadId);
  }
}
```

#### 分片上传服务
```typescript
// server/src/upload/upload.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  private chunkDir: string;

  constructor(private configService: ConfigService) {
    this.chunkDir = path.join(process.cwd(), 'uploads', 'chunks');
    if (!fs.existsSync(this.chunkDir)) {
      fs.mkdirSync(this.chunkDir, { recursive: true });
    }
  }

  async initChunkedUpload(dto: InitChunkedUploadDto) {
    const uploadId = uuidv4();
    const chunkDir = path.join(this.chunkDir, uploadId);
    
    fs.mkdirSync(chunkDir, { recursive: true });

    // 保存上传元数据
    const meta = {
      uploadId,
      fileName: dto.fileName,
      fileSize: dto.fileSize,
      chunkSize: dto.chunkSize,
      totalChunks: Math.ceil(dto.fileSize / dto.chunkSize),
      chunksReceived: [],
      createdAt: new Date(),
    };

    fs.writeFileSync(
      path.join(chunkDir, 'meta.json'),
      JSON.stringify(meta, null, 2)
    );

    return { uploadId, ...meta };
  }

  async uploadChunk(
    uploadId: string,
    chunk: Express.Multer.File,
    dto: UploadChunkDto,
  ) {
    const chunkDir = path.join(this.chunkDir, uploadId);
    const metaPath = path.join(chunkDir, 'meta.json');

    if (!fs.existsSync(metaPath)) {
      throw new NotFoundException('上传任务不存在');
    }

    // 保存分片
    const chunkPath = path.join(chunkDir, `chunk-${dto.chunkIndex}`);
    fs.renameSync(chunk.path, chunkPath);

    // 更新元数据
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    if (!meta.chunksReceived.includes(dto.chunkIndex)) {
      meta.chunksReceived.push(dto.chunkIndex);
    }
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

    return {
      uploadId,
      chunkIndex: dto.chunkIndex,
      received: meta.chunksReceived.length,
      total: meta.totalChunks,
      progress: (meta.chunksReceived.length / meta.totalChunks) * 100,
    };
  }

  async mergeChunks(uploadId: string) {
    const chunkDir = path.join(this.chunkDir, uploadId);
    const metaPath = path.join(chunkDir, 'meta.json');

    if (!fs.existsSync(metaPath)) {
      throw new NotFoundException('上传任务不存在');
    }

    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));

    // 检查是否所有分片都已上传
    if (meta.chunksReceived.length !== meta.totalChunks) {
      throw new BadRequestException('分片不完整，无法合并');
    }

    // 合并分片
    const finalPath = path.join(
      this.configService.uploadDir,
      `${uploadId}_${meta.fileName}`
    );

    const writeStream = fs.createWriteStream(finalPath);

    for (let i = 0; i < meta.totalChunks; i++) {
      const chunkPath = path.join(chunkDir, `chunk-${i}`);
      const chunkBuffer = fs.readFileSync(chunkPath);
      writeStream.write(chunkBuffer);
    }

    writeStream.end();

    // 清理分片
    fs.rmSync(chunkDir, { recursive: true });

    return {
      filePath: finalPath,
      fileName: meta.fileName,
      fileSize: meta.fileSize,
    };
  }

  async cancelUpload(uploadId: string) {
    const chunkDir = path.join(this.chunkDir, uploadId);

    if (fs.existsSync(chunkDir)) {
      fs.rmSync(chunkDir, { recursive: true });
    }

    return { message: '上传已取消' };
  }
}
```

**优先级**: 🟡 P1 - 下下周完成  
**工作量**: 3-5天  
**收益**: 支持大文件上传，提升用户体验

---

## 📊 监控与日志 - 下月完成

### 1. 结构化日志

#### 安装依赖
```bash
cd server
npm install --save winston winston-daily-rotate-file
```

#### 日志服务
```typescript
// server/src/logger/logger.service.ts
import { Injectable, Scope } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: {
        service: 'private-cloud-storage',
        environment: process.env.NODE_ENV || 'development',
      },
      transports: [
        // 控制台输出
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),

        // 按日期轮转的错误日志
        new winston.transports.DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '14d',
        }),

        // 按日期轮转的合并日志
        new winston.transports.DailyRotateFile({
          filename: 'logs/combined-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
        }),
      ],
    });
  }

  log(message: string, meta?: Record<string, any>) {
    this.logger.info(message, meta);
  }

  error(message: string, trace?: string, meta?: Record<string, any>) {
    this.logger.error(message, { trace, ...meta });
  }

  warn(message: string, meta?: Record<string, any>) {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: Record<string, any>) {
    this.logger.debug(message, meta);
  }
}
```

**优先级**: 🟢 P2 - 下月完成  
**工作量**: 2-3天

---

## 🎯 总结与下一步

### 本周任务（Week 1)
- [ ] 修复 JWT 安全漏洞
- [ ] 加固 CORS 配置
- [ ] 添加速率限制
- [ ] 添加数据库索引
- [ ] 优化数据库连接池

**预计工时**: 1-2天  
**风险**: 低  
**收益**: 高（安全性大幅提升）

### 下周任务（Week 2)
- [ ] 集成 Redis 缓存
- [ ] 在核心服务中添加缓存逻辑
- [ ] 实现缓存失效策略

**预计工时**: 2-3天  
**风险**: 中  
**收益**: 高（性能提升60-80%）

### 下下周任务（Week 3)
- [ ] 实现分片上传
- [ ] 前端对接分片上传接口
- [ ] 断点续传支持

**预计工时**: 3-5天  
**风险**: 中  
**收益**: 中（用户体验提升）

---

## 📞 支持与反馈

如果在实施过程中遇到问题，请：
1. 查看详细错误信息
2. 检查配置文件
3. 查看日志文件
4. 联系后端架构师团队

---

**文档版本**: v1.0  
**创建日期**: 2026-05-09  
**作者**: 后端架构师  
**审核**: 待审核
