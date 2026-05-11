import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { PreviewService } from './preview.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@Controller('preview')
export class PreviewController {
  constructor(private readonly previewService: PreviewService) {}

  @Get(':fileId/info')
  @UseGuards(JwtAuthGuard)
  async getPreviewInfo(@Param('fileId') fileId: string) {
    return this.previewService.getPreviewInfo(fileId);
  }

  @Get(':fileId/stream')
  async streamFile(@Param('fileId') fileId: string, @Res() res: Response) {
    return this.previewService.streamFile(fileId, res);
  }

  // 公开分享预览流（通过share code访问）
  @Public()
  @Get('share/:fileId/stream')
  async shareStream(@Param('fileId') fileId: string, @Res() res: Response) {
    return this.previewService.streamFile(fileId, res);
  }
}
