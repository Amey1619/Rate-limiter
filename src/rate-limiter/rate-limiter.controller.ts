import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RateLimiterService } from './rate-limiter.service';

@Controller()
export class RateLimiterController {
  constructor(private readonly rateLimiterService: RateLimiterService) {}

  @MessagePattern({ cmd: 'check_rate_limit' })
  async handleRateLimit(@Payload() data: { ip: string }) {
    return await this.rateLimiterService.checkSlidingWindow(data.ip);
  }
}
