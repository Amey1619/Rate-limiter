import { ReqLimiterService } from './reqlimiter.service';
import type { ReqLimiterFactoryOptions } from './types';

export function rateLimit(options: ReqLimiterFactoryOptions): ReqLimiterService {
  const { redisClient, config = {} } = options;

  if (!redisClient) {
    throw new Error(
      '[rate-limit] Redis client is required. Please create and pass a connected Redis instance.',
    );
  }

  return new ReqLimiterService({
    redisClient,
    windowSize: config.windowSize,
    maxRequests: config.maxRequests,
    banDuration: config.banDuration,
    abuseThreshold: config.abuseThreshold,
    abuseWindow: config.abuseWindow,
  });
}
