import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FolderService } from './folder.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('folders')
@UseGuards(JwtAuthGuard)
export class FolderController {
  constructor(private readonly folderService: FolderService) {}

  @Get()
  async getTree(@CurrentUser('id') userId: string, @Query('parent_id') parentId?: string) {
    return this.folderService.getTree(userId, parentId || null);
  }

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() body: { name: string; parent_id?: string },
  ) {
    return this.folderService.create(userId, body);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: { name?: string; parent_id?: string },
  ) {
    return this.folderService.update(id, userId, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.folderService.remove(id, userId);
  }

  @Put(':id/pin')
  async togglePin(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.folderService.togglePin(id, userId);
  }

  @Put(':id/encrypt')
  async setEncrypt(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: { password: string },
  ) {
    return this.folderService.setEncryptPassword(id, userId, body.password);
  }
}
