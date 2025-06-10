// app.module.ts
import { Module } from '@nestjs/common';
import { RateLimiterModule } from './rate-limiter/rate-limiter.module';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make config globally available
      envFilePath: '.env', // Specify the path to your .env file (optional)
    }),
    RedisModule,
    RateLimiterModule,
  ],
})
export class AppModule {}
