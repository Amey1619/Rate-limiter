import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { RateLimiterGuard } from './rate-limiter/rate-limiter.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('limited')
  @UseGuards(RateLimiterGuard)
  getlimited(): string {
    return this.appService.getLimited();
  }

  @Get('unlimited')
  getunlimited(): string {
    return this.appService.getUnlimited();
  }
}
