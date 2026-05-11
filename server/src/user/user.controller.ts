import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles('admin')
  async findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.userService.findAll(+page, +limit);
  }

  @Get(':id')
  @Roles('admin')
  async findById(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Put(':id/ban')
  @Roles('admin')
  async banUser(@Param('id') id: string) {
    return this.userService.banUser(id);
  }

  @Put(':id/unban')
  @Roles('admin')
  async unbanUser(@Param('id') id: string) {
    return this.userService.unbanUser(id);
  }

  @Delete(':id')
  @Roles('admin')
  async deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }

  @Put(':id/quota')
  @Roles('admin')
  async updateQuota(@Param('id') id: string, @Query('quota') quota: number) {
    return this.userService.updateQuota(id, +quota);
  }
}
