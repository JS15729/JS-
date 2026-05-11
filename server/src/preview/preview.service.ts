import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { File, FileDocument } from '../schemas/file.schema';

@Injectable()
export class PreviewService {
  constructor(@InjectModel(File.name) private fileModel: Model<FileDocument>) {}

  private imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp'];
  private videoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/x-msvideo'];
  private audioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac'];
  private textTypes = ['text/plain', 'text/html', 'text/css', 'text/javascript', 'application/json', 'application/xml'];
  private codeTypes = [
    'text/javascript', 'text/typescript', 'text/html', 'text/css',
    'application/json', 'text/x-python', 'text/x-java', 'text/x-c', 'text/x-c++',
    'text/x-go', 'text/x-rust', 'text/x-php', 'text/x-ruby', 'text/x-shellscript',
    'text/x-sql', 'text/x-yaml', 'text/x-toml',
  ];
  private officeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ];

  async getPreviewInfo(fileId: string) {
    const file = await this.fileModel.findById(fileId);
    if (!file || file.is_deleted) throw new NotFoundException('文件不存在');

    if (!fs.existsSync(file.storage_path)) {
      throw new NotFoundException('文件数据丢失');
    }

    const mimeType = file.mime_type || '';
    const previewType = this.getPreviewType(mimeType);

    return {
      file: {
        id: file._id,
        name: file.name,
        original_name: file.original_name,
        size: file.size,
        mime_type: file.mime_type,
        preview_type: previewType,
      },
    };
  }

  async streamFile(fileId: string, res: any) {
    const file = await this.fileModel.findById(fileId);
    if (!file || file.is_deleted) throw new NotFoundException('文件不存在');

    if (!fs.existsSync(file.storage_path)) {
      throw new NotFoundException('文件数据丢失');
    }

    const stat = fs.statSync(file.storage_path);
    const mimeType = file.mime_type || 'application/octet-stream';
    const previewType = this.getPreviewType(mimeType);

    // 对于可以在浏览器直接预览的类型，使用inline；其他使用attachment
    const disposition = this.isDirectPreview(previewType) ? 'inline' : 'attachment';

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `${disposition}; filename*=UTF-8''${encodeURIComponent(file.original_name)}`,
      'Content-Length': stat.size,
      'Accept-Ranges': 'bytes',
    });

    // 支持Range请求（视频/音频拖动）
    const range = res.req?.headers?.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunkSize = end - start + 1;

      res.status(206);
      res.set({
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Content-Length': chunkSize,
      });

      const stream = fs.createReadStream(file.storage_path, { start, end });
      stream.pipe(res);
    } else {
      const stream = fs.createReadStream(file.storage_path);
      stream.pipe(res);
    }
  }

  private getPreviewType(mimeType: string): string {
    if (!mimeType) return 'unknown';

    if (this.imageTypes.includes(mimeType)) return 'image';
    if (this.videoTypes.includes(mimeType)) return 'video';
    if (this.audioTypes.includes(mimeType)) return 'audio';
    if (mimeType === 'application/pdf') return 'pdf';
    if (this.codeTypes.includes(mimeType)) return 'code';
    if (this.textTypes.includes(mimeType)) return 'text';
    if (mimeType === 'text/markdown' || mimeType === 'text/x-markdown') return 'markdown';
    if (this.officeTypes.includes(mimeType)) return 'office';
    return 'unknown';
  }

  private isDirectPreview(previewType: string): boolean {
    return ['image', 'video', 'audio', 'pdf', 'text', 'code', 'markdown'].includes(previewType);
  }
}
