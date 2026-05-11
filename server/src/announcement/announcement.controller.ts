import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AnnouncementService } from './announcement.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('announcements')
@UseGuards(JwtAuthGuard)
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    return this.announcementService.findAll(userId);
  }

  @Get('unread')
  async getUnreadCount(@CurrentUser('id') userId: string) {
    return this.announcementService.getUnreadCount(userId);
  }

  @Post(':id/read')
  async markAsRead(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.announcementService.markAsRead(id, userId);
  }

  @Post('read-all')
  async markAllRead(@CurrentUser('id') userId: string) {
    return this.announcementService.markAllRead(userId);
  }

  // 管理员操作
  @Post()
  @Roles('admin')
  async create(
    @CurrentUser('id') userId: string,
    @Body() body: { title: string; content: string; level?: string; is_pinned?: boolean },
  ) {
    return this.announcementService.create(userId, body);
  }

  @Put(':id')
  @Roles('admin')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.announcementService.update(id, body);
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id') id: string) {
    return this.announcementService.remove(id);
  }
}
