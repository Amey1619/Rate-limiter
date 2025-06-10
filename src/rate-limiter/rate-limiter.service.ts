/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RateLimiterService {
  private readonly WINDOW_SIZE = 60; // in seconds
  private readonly MAX_REQUESTS = 10; // maximum requests per window
  private readonly BAN_DURATION = 3600; // in seconds (1 hour)
  private readonly ABUSE_THRESHOLD = 5;
  private readonly ABUSE_WINDOW = 60; // in seconds
  private readonly logger = new Logger(RateLimiterService.name);

  constructor(private readonly redisService: RedisService) {}

  async checkSlidingWindow(
    ip: string,
  ): Promise<{ allowed: boolean; remaining: number }> {
    const redis = this.redisService.getClient();

    const now = Date.now();
    const windowStart = now - this.WINDOW_SIZE * 1000;
    const key = `sliding_window:${ip}`;
    const abuseKey = `abuse:${ip}`;
    const banKey = `ban:${ip}`;

    // 1. Check if IP is already banned
    const isBanned = await redis.get(banKey);
    if (isBanned) {
      this.logger.warn(`IP ${ip} is currently banned`);
      return {
        allowed: false,
        remaining: 0,
      };
    }

    const luaScript = `
      redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, ARGV[2])
      local count = redis.call('ZCARD', KEYS[1])
      if count < tonumber(ARGV[3]) then
        redis.call('ZADD', KEYS[1], ARGV[1], ARGV[1])
        redis.call('EXPIRE', KEYS[1], tonumber(ARGV[4]))
        return {1, tonumber(ARGV[3]) - count - 1}
      else
        return {0, 0}
      end
    `;

    try {
      const pong = await this.redisService.healthCheck();
      if (pong !== 'PONG') {
        throw new Error('Redis health check failed');
      }

      const result = await redis.eval(
        luaScript,
        1,
        key,
        now.toString(),
        windowStart.toString(),
        this.MAX_REQUESTS.toString(),
        this.WINDOW_SIZE.toString(),
      );

      const [allowed, remaining] = result as [number, number];

      if (allowed === 1) {
        return { allowed: true, remaining };
      }

      // Track abuse: if not allowed
      const violations = await redis.incr(abuseKey);
      if (violations === 1) {
        await redis.expire(abuseKey, this.ABUSE_WINDOW);
      }

      if (violations >= this.ABUSE_THRESHOLD) {
        await redis.set(banKey, '1', 'EX', this.BAN_DURATION);
        this.logger.warn(
          `IP ${ip} banned for ${this.BAN_DURATION / 60} minutes due to abuse.`,
        );
      }

      return { allowed: false, remaining: 0 };
    } catch (error: any) {
      this.logger.error(`Redis Lua script error: ${error.message}`);
      return {
        allowed: false,
        remaining: 0,
      };
    }
  }
}
