import type Redis from 'ioredis';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface ReqLimiterResult {
  allowed: boolean;
  remaining: number;
}

export interface ReqLimiterOptions {
  redisClient: Redis;
  windowSize?: number;
  maxRequests?: number;
  banDuration?: number;
  abuseThreshold?: number;
  abuseWindow?: number;
}

export class ReqLimiterService {
  private readonly redis: Redis;
  private readonly WINDOW_SIZE: number;
  private readonly MAX_REQUESTS: number;
  private readonly BAN_DURATION: number;
  private readonly ABUSE_THRESHOLD: number;
  private readonly ABUSE_WINDOW: number;
  private readonly luaScript: string;

  constructor(options: ReqLimiterOptions) {
    if (!options?.redisClient) {
      throw new Error(
        'Redis client is required to initialize RateLimiterService.',
      );
    }

    this.redis = options.redisClient;
    this.WINDOW_SIZE = options.windowSize ?? 60;
    this.MAX_REQUESTS = options.maxRequests ?? 10;
    this.BAN_DURATION = options.banDuration ?? 3600;
    this.ABUSE_THRESHOLD = options.abuseThreshold ?? 5;
    this.ABUSE_WINDOW = options.abuseWindow ?? 60;

    // Load Lua script from file
    this.luaScript = readFileSync(join(__dirname, 'lua', 'logic.lua'), 'utf8');
  }

  public async check(ip: string): Promise<ReqLimiterResult> {
    const now = Date.now();
    const windowStart = now - this.WINDOW_SIZE * 1000;

    const key = `sliding_window:${ip}`;
    const abuseKey = `abuse:${ip}`;
    const banKey = `ban:${ip}`;

    // 1. Banned check
    const isBanned = await this.redis.get(banKey);
    if (isBanned) {
      return { allowed: false, remaining: 0 };
    }

    try {
      const result = await this.redis.eval(
        this.luaScript,
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

      // Track abuse
      const violations = await this.redis.incr(abuseKey);
      if (violations === 1) {
        await this.redis.expire(abuseKey, this.ABUSE_WINDOW);
      }

      if (violations >= this.ABUSE_THRESHOLD) {
        await this.redis.set(banKey, '1', 'EX', this.BAN_DURATION);
      }

      return { allowed: false, remaining: 0 };
    } catch (error: any) {
      console.error(`[RateLimiter] Redis error: ${(error as Error).message}`);
      return { allowed: false, remaining: 0 };
    }
  }
  public async isAllowed(ip: string): Promise<boolean> {
    const result = await this.check(ip);
    return result.allowed;
  }
}
