import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly redis: Redis;
  constructor() {
    this.redis = new Redis({ host: 'localhost', port: 6379 }); // Connect to Redis
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) await this.redis.set(key, value, 'EX', ttl);
    else await this.redis.set(key, value);
  }

  async incr(key: string): Promise<number> {
    return this.redis.incr(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.redis.expire(key, seconds);
  }

  // redis.service.ts
  async healthCheck() {
    return this.redis.ping(); // Should return "PONG"
  }
}
