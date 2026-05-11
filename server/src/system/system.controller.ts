import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { SystemService } from './system.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('system')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('configs')
  async getConfigs() {
    return this.systemService.getAllConfigs();
  }

  @Put('configs/:key')
  async updateConfig(
    @Param('key') key: string,
    @Body() body: { value: string; description?: string },
  ) {
    return this.systemService.updateConfig(key, body.value, body.description);
  }

  @Get('stats')
  async getStats() {
    return this.systemService.getStats();
  }

  @Get('analytics')
  async getAnalytics() {
    return this.systemService.getStorageBreakdown();
  }
}
