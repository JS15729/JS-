import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';
import { ConfigService } from '../config/config.service';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(private configService: ConfigService) {}

  /**
   * 每天凌晨2点自动备份
   */
  @Cron('0 2 * * *')
  async autoBackup() {
    this.logger.log('开始自动备份...');
    try {
      const result = await this.runBackup();
      this.logger.log(`自动备份完成: ${result.file}`);
    } catch (error) {
      this.logger.error(`自动备份失败: ${error.message}`);
    }
  }

  async runBackup() {
    const backupDir = path.resolve(this.configService.backupDir);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const uploadDir = path.resolve(this.configService.uploadDir);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.zip`;
    const backupPath = path.join(backupDir, backupFileName);

    return new Promise<{ file: string; size: number }>((resolve, reject) => {
      const output = fs.createWriteStream(backupPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        this.logger.log(`备份完成: ${backupFileName} (${archive.pointer()} bytes)`);

        // 清理旧备份（保留最近30天）
        this.cleanOldBackups(backupDir, 30);

        resolve({ file: backupFileName, size: archive.pointer() });
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);

      // 备份文件存储目录
      const filesDir = path.join(uploadDir, 'files');
      if (fs.existsSync(filesDir)) {
        archive.directory(filesDir, 'files');
      }

      archive.finalize();
    });
  }

  getBackupStatus() {
    const backupDir = path.resolve(this.configService.backupDir);
    if (!fs.existsSync(backupDir)) {
      return { backups: [], total_size: 0 };
    }

    const files = fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.zip'))
      .map(f => {
        const filePath = path.join(backupDir, f);
        const stat = fs.statSync(filePath);
        return {
          name: f,
          size: stat.size,
          created_at: stat.birthtime || stat.mtime,
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const totalSize = files.reduce((sum, f) => sum + f.size, 0);

    return { backups: files, total_size: totalSize };
  }

  private cleanOldBackups(backupDir: string, keepDays: number) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - keepDays);

    const files = fs.readdirSync(backupDir);
    for (const file of files) {
      const filePath = path.join(backupDir, file);
      const stat = fs.statSync(filePath);
      if (stat.birthtime < cutoff || stat.mtime < cutoff) {
        try {
          fs.unlinkSync(filePath);
          this.logger.log(`已清理旧备份: ${file}`);
        } catch (e) {
          this.logger.error(`清理旧备份失败: ${file}`);
        }
      }
    }
  }
}
