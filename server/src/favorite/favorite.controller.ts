import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    return this.favoriteService.findAll(userId);
  }

  @Post(':fileId')
  async add(@CurrentUser('id') userId: string, @Param('fileId') fileId: string) {
    return this.favoriteService.add(userId, fileId);
  }

  @Delete(':fileId')
  async remove(@CurrentUser('id') userId: string, @Param('fileId') fileId: string) {
    return this.favoriteService.remove(userId, fileId);
  }
}
