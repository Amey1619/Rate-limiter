import { Module } from '@nestjs/common';
import { RateLimiterService } from './rate-limiter.service';
import { RedisModule } from '../redis/redis.module';
import { RateLimiterController } from './rate-limiter.controller';

@Module({
  imports: [RedisModule],
  controllers: [RateLimiterController],
  providers: [RateLimiterService],
  exports: [RateLimiterService],
})
export class RateLimiterModule {}
