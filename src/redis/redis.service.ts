import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly logger = new Logger(RedisService.name); // Use console for simplicity, replace with your logger
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
    });

    this.redis.on('connect', () => {
      this.logger.log('✅ Redis connected');
    });

    this.redis.on('error', (err) => {
      this.logger.error('❌ Redis error', err);
    });
  }

  // Get raw Redis client
  getClient(): Redis {
    return this.redis;
  }

  // GET value by key
  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  // SET value with optional TTL
  async set(key: string, value: string, ttlInSeconds?: number): Promise<void> {
    if (ttlInSeconds) {
      await this.redis.set(key, value, 'EX', ttlInSeconds);
    } else {
      await this.redis.set(key, value);
    }
  }

  // INCR key
  async incr(key: string): Promise<number> {
    return this.redis.incr(key);
  }

  // Set expiration time
  async expire(key: string, seconds: number): Promise<number> {
    return this.redis.expire(key, seconds);
  }

  // Delete a key
  async del(key: string): Promise<number> {
    return this.redis.del(key);
  }

  // Health check
  async healthCheck(): Promise<string> {
    return this.redis.ping(); // returns 'PONG' if OK
  }

  // --- For Sliding Window Log pattern ---
  async zadd(key: string, score: number, member: string): Promise<number> {
    return this.redis.zadd(key, score.toString(), member);
  }

  async zremrangebyscore(
    key: string,
    min: number,
    max: number,
  ): Promise<number> {
    return this.redis.zremrangebyscore(key, min.toString(), max.toString());
  }

  async zrangebyscore(
    key: string,
    min: number,
    max: number,
  ): Promise<string[]> {
    return this.redis.zrangebyscore(key, min.toString(), max.toString());
  }

  // Transaction (multi)
  multi() {
    return this.redis.multi();
  }

  // Graceful shutdown
  async onModuleDestroy() {
    await this.redis.quit();
    this.logger.log('🧹 Redis connection closed.');
  }
}
