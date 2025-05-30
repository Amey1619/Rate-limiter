import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RateLimiterService {
  constructor(private readonly redis: RedisService) {}

  async checkRateLimit(
    ip: string,
  ): Promise<{ allowed: boolean; remaining: number }> {
    const BUCKET_CAPACITY = 10; // Max 10 requests
    const REFILL_RATE = 1; // 1 token per second
    const now = Math.floor(Date.now() / 1000); // Current time in seconds

    const key = `rate_limit:${ip}`;
    const lastRefillStr = await this.redis.get(`${key}:last_refill`);
    const tokensStr = await this.redis.get(`${key}:tokens`);

    // Initialize bucket if empty
    if (!lastRefillStr || !tokensStr) {
      await this.redis.set(`${key}:tokens`, BUCKET_CAPACITY.toString());
      await this.redis.set(`${key}:last_refill`, now.toString());
      return { allowed: true, remaining: BUCKET_CAPACITY - 1 };
    }

    const lastRefill = parseInt(lastRefillStr);
    const tokens = parseInt(tokensStr);

    // Calculate refill since last request
    const elapsed = now - lastRefill;
    const newTokens = elapsed * REFILL_RATE;
    const currentTokens = Math.min(tokens + newTokens, BUCKET_CAPACITY);

    // Update bucket
    const newTokenCount = currentTokens - 1;
    await this.redis.set(`${key}:tokens`, newTokenCount.toString());
    await this.redis.set(`${key}:last_refill`, now.toString());

    return {
      allowed: newTokenCount >= 0,
      remaining: Math.max(newTokenCount, 0),
    };
  }
}
