import {
  Controller,
  Get,
  Post,
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
import { ShareService } from './share.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('shares')
@UseGuards(JwtAuthGuard)
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() body: { file_id: string; password?: string; type?: string; expires_at?: string },
  ) {
    return this.shareService.create(userId, body);
  }

  @Get()
  async findByUser(@CurrentUser('id') userId: string) {
    return this.shareService.findByUser(userId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.shareService.remove(id, userId);
  }
}

// 公开分享访问控制器（无需登录）
@Controller('s')
export class SharePublicController {
  constructor(private readonly shareService: ShareService) {}

  @Public()
  @Get(':code')
  async getByCode(@Param('code') code: string) {
    return this.shareService.getByCode(code);
  }

  @Public()
  @Post(':code/verify')
  async verifyCode(
    @Param('code') code: string,
    @Body() body: { password: string },
  ) {
    return this.shareService.verifyCode(code, body.password);
  }

  @Public()
  @Get(':code/download')
  async download(
    @Param('code') code: string,
    @Query('password') password: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { file } = await this.shareService.downloadByCode(code, password);

    if (!fs.existsSync(file.storage_path)) {
      throw new Error('文件数据丢失');
    }

    res.set({
      'Content-Type': file.mime_type || 'application/octet-stream',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.original_name)}`,
      'Content-Length': fs.statSync(file.storage_path).size,
    });

    const stream = fs.createReadStream(file.storage_path);
    return new StreamableFile(stream);
  }
}
