import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as path from 'path';

@Injectable()
export class ConfigService {
  private readonly envConfig: Record<string, string>;

  constructor() {
    // 尝试加载 .env 文件，如果不存在则使用默认值
    const envPath = path.resolve(process.cwd(), '.env');
    const result = dotenv.config({ path: envPath });
    this.envConfig = result.parsed || {};
  }

  get(key: string, defaultValue?: string): string {
    return process.env[key] || this.envConfig[key] || defaultValue || '';
  }

  getNumber(key: string, defaultValue?: number): number {
    const val = this.get(key);
    return val ? parseInt(val, 10) : defaultValue || 0;
  }

  get uploadDir(): string {
    return this.get('UPLOAD_DIR', './uploads');
  }

  get backupDir(): string {
    return this.get('BACKUP_DIR', './backups');
  }

  get chunkSize(): number {
    return this.getNumber('CHUNK_SIZE', 5 * 1024 * 1024); // 5MB
  }

  get maxFileSize(): number {
    return this.getNumber('MAX_FILE_SIZE', 10 * 1024 * 1024 * 1024); // 10GB
  }
}
