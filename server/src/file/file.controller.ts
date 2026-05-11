import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';
import { FileService } from './file.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get()
  async findByFolder(
    @CurrentUser('id') userId: string,
    @Query('folder_id') folderId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.fileService.findByFolder(userId, folderId || null, +page, +limit);
  }

  @Get('pinned')
  async getPinned(@CurrentUser('id') userId: string) {
    return this.fileService.getPinned(userId);
  }

  @Get('dedup-check')
  async checkDedup(
    @CurrentUser('id') userId: string,
    @Query('hash') hash: string,
  ) {
    return this.fileService.checkDedup(hash, userId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.fileService.findById(id);
  }

  @Post()
  async create(@CurrentUser('id') userId: string, @Body() body: any) {
    return this.fileService.create(userId, body);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    return this.fileService.update(id, userId, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.fileService.remove(id, userId);
  }

  @Post('batch-delete')
  async batchDelete(
    @CurrentUser('id') userId: string,
    @Body() body: { ids: string[] },
  ) {
    return this.fileService.batchDelete(body.ids, userId);
  }

  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { file, filePath } = await this.fileService.download(id);

    res.set({
      'Content-Type': file.mime_type || 'application/octet-stream',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.original_name)}`,
      'Content-Length': fs.statSync(filePath).size,
    });

    const stream = fs.createReadStream(filePath);
    return new StreamableFile(stream);
  }

  @Post('batch-download')
  async batchDownload(
    @CurrentUser('id') userId: string,
    @Body() body: { ids: string[] },
    @Res({ passthrough: false }) res: Response,
  ) {
    const files = await this.fileService.getFilesForBatch(body.ids, userId);

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="files_${Date.now()}.zip"`,
    });

    const archive = archiver('zip', { zlib: { level: 5 } });
    archive.pipe(res);

    for (const f of files) {
      const filePath = path.resolve(f.storage_path);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: f.original_name || f.name });
      }
    }

    archive.on('error', (err) => {
      if (!res.headersSent) {
        res.status(500).json({ message: '压缩失败: ' + err.message });
      }
    });

    await archive.finalize();
  }

  @Get(':id/note')
  async getNote(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.fileService.getNote(id, userId);
  }

  @Post(':id/note')
  async saveNote(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: { content: string },
  ) {
    return this.fileService.saveNote(id, userId, body.content);
  }
}
