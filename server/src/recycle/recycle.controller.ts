import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { RecycleService } from './recycle.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('recycle')
@UseGuards(JwtAuthGuard)
export class RecycleController {
  constructor(private readonly recycleService: RecycleService) {}

  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    return this.recycleService.findAll(userId);
  }

  @Post('file/:fileId/restore')
  async restoreFile(@Param('fileId') fileId: string, @CurrentUser('id') userId: string) {
    return this.recycleService.restoreFile(fileId, userId);
  }

  @Post('folder/:folderId/restore')
  async restoreFolder(@Param('folderId') folderId: string, @CurrentUser('id') userId: string) {
    return this.recycleService.restoreFolder(folderId, userId);
  }

  @Delete('file/:fileId')
  async permanentDeleteFile(@Param('fileId') fileId: string, @CurrentUser('id') userId: string) {
    return this.recycleService.permanentDeleteFile(fileId, userId);
  }

  @Delete('folder/:folderId')
  async permanentDeleteFolder(@Param('folderId') folderId: string, @CurrentUser('id') userId: string) {
    return this.recycleService.permanentDeleteFolder(folderId, userId);
  }

  @Delete()
  async emptyRecycle(@CurrentUser('id') userId: string) {
    return this.recycleService.emptyRecycle(userId);
  }
}
