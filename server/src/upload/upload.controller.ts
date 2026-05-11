import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ConfigService } from '../config/config.service';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private configService: ConfigService,
  ) {}

  @Post('init')
  async initUpload(
    @CurrentUser('id') userId: string,
    @Body() body: {
      file_name: string;
      file_size: number;
      file_hash: string;
      mime_type: string;
      total_chunks: number;
      chunk_size: number;
      folder_id?: string;
    },
  ) {
    return this.uploadService.initUpload(userId, body);
  }

  @Post('chunk')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const tempDir = path.resolve('./uploads/temp');
          if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
          }
          cb(null, tempDir);
        },
        filename: (req, file, cb) => {
          const safeName = Buffer.from(file.originalname, 'latin1').toString('utf8');
          cb(null, `${uuidv4()}_${safeName}`);
        },
      }),
      limits: { fileSize: 100 * 1024 * 1024 }, // 单分片最大100MB
    }),
  )
  async uploadChunk(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: {
      upload_id: string;
      file_hash: string;
      chunk_index: number;
      total_chunks: number;
    },
  ) {
    return this.uploadService.uploadChunk(userId, file, body);
  }

  @Post('merge')
  async mergeChunks(
    @CurrentUser('id') userId: string,
    @Body() body: {
      upload_id: string;
      file_hash: string;
      file_name: string;
      mime_type: string;
      total_chunks: number;
      folder_id?: string;
      tags?: string[];
    },
  ) {
    return this.uploadService.mergeChunks(userId, body);
  }

  @Post('simple')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const tempDir = path.resolve('./uploads/temp');
          if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
          }
          cb(null, tempDir);
        },
        filename: (req, file, cb) => {
          const safeName = Buffer.from(file.originalname, 'latin1').toString('utf8');
          cb(null, `${uuidv4()}_${safeName}`);
        },
      }),
      limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    }),
  )
  async simpleUpload(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('folder_id') folderId?: string,
  ) {
    return this.uploadService.simpleUpload(userId, file, folderId);
  }

  @Get('progress/:uploadId')
  async getProgress(
    @Param('uploadId') uploadId: string,
    @Query('file_hash') fileHash: string,
    @Query('total_chunks') totalChunks: number,
  ) {
    return this.uploadService.getProgress(uploadId, fileHash, +totalChunks);
  }
}
