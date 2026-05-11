import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TagService } from './tag.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('tags')
@UseGuards(JwtAuthGuard)
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    return this.tagService.findAll(userId);
  }

  @Post()
  async create(@CurrentUser('id') userId: string, @Body() body: { name: string; color?: string }) {
    return this.tagService.create(userId, body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() body: { name?: string; color?: string }) {
    return this.tagService.update(id, userId, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.tagService.remove(id, userId);
  }
}
