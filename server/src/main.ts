import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import * as bodyParser from 'body-parser';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局前缀
  app.setGlobalPrefix('api');

  // 🔒 跨域配置 - 安全加固
  const allowedOrigins = (
    process.env.ALLOWED_ORIGINS || 
    'http://localhost:5173,http://localhost:3000'
  ).split(',').map(origin => origin.trim());
  
  app.enableCors({
    // 🔒 明确指定允许的域名，禁止随意通配
    origin: (origin, callback) => {
      // 允许无origin的请求（移动应用、Postman、curl等）
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`🚨 CORS拒绝访问：Origin=${origin}`);
        callback(new Error(`CORS policy: Origin ${origin} not allowed`), false);
      }
    },
    credentials: true,
    maxAge: 86400, // 24小时
    
    // 🔒 明确指定允许的HTTP方法
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    
    // 🔒 明确指定允许的请求头
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    
    // 🔒 禁止暴露敏感头信息
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  });

  // 增大请求体限制以支持大文件上传
  app.use(bodyParser.json({ limit: '100mb' }));
  app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

  // 提供静态文件（头像等）
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // 全局响应转换拦截器
  app.useGlobalInterceptors(new TransformInterceptor());

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Private Cloud Storage Server running on http://localhost:${port}`);
}
bootstrap();
