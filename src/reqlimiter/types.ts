import type { Redis } from 'ioredis';

// Internal config passed to the service
export interface ReqLimiterConfig {
  windowSize: number; // Time window in seconds
  maxRequests: number; // Max requests allowed per window
  banDuration: number; // Ban duration in seconds
  abuseThreshold: number; // Violations before ban
  abuseWindow: number; // Window to track abuse
}

// User-facing config (optional values)
export interface ReqLimiterFactoryOptions {
  redisClient: Redis; // Connected Redis client
  config?: Partial<ReqLimiterConfig>; // Optional overrides
}

// Response from limiter
export interface ReqLimiterResult {
  allowed: boolean; // If request is allowed
  remaining: number; // Remaining allowed requests
}
