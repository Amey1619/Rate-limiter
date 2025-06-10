// src/rate-limiter/rate-limiter.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { RateLimiterService } from './rate-limiter.service';
import { RedisService } from '../redis/redis.service';

describe('RateLimiterService', () => {
  let service: RateLimiterService;
  let redisService: RedisService;

  const mockRedisClient = {
    eval: jest.fn(),
    get: jest.fn(),
    zremrangebyscore: jest.fn(),
    zcount: jest.fn(),
    zadd: jest.fn(),
    expire: jest.fn(),
  };

  const mockRedisService = {
    getClient: () => mockRedisClient,
    healthCheck: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimiterService,
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<RateLimiterService>(RateLimiterService);
    redisService = module.get<RedisService>(RedisService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkSlidingWindow', () => {
    it('should allow request when below limit', async () => {
      jest.spyOn(redisService, 'healthCheck').mockResolvedValue('PONG');
      mockRedisClient.eval.mockResolvedValue([1, 9]);

      const result = await service.checkSlidingWindow('127.0.0.1');

      expect(redisService.healthCheck).toHaveBeenCalled();
      expect(mockRedisClient.eval).toHaveBeenCalled();
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it('should block request when over limit', async () => {
      jest.spyOn(redisService, 'healthCheck').mockResolvedValue('PONG');
      mockRedisClient.eval.mockResolvedValue([0, 0]);

      const result = await service.checkSlidingWindow('127.0.0.1');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should handle redis health check failure', async () => {
      jest
        .spyOn(redisService, 'healthCheck')
        .mockRejectedValue(new Error('Redis down'));

      const result = await service.checkSlidingWindow('127.0.0.1');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });
});
