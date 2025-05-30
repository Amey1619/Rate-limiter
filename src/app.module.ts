import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisService } from './redis/redis.service';
import { RateLimiterService } from './rate-limiter/rate-limiter.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, RedisService, RateLimiterService],
})
export class AppModule {}
