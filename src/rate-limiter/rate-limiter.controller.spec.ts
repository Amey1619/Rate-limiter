import { Test, TestingModule } from '@nestjs/testing';
import { RateLimiterController } from './rate-limiter.controller';
import { RateLimiterService } from './rate-limiter.service';

describe('RateLimiterController (Microservice)', () => {
  let controller: RateLimiterController;
  let service: RateLimiterService;

  const mockRateLimiterService = {
    checkSlidingWindow: jest.fn().mockResolvedValue({
      allowed: true,
      remaining: 8,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RateLimiterController],
      providers: [
        {
          provide: RateLimiterService,
          useValue: mockRateLimiterService,
        },
      ],
    }).compile();

    controller = module.get<RateLimiterController>(RateLimiterController);
    service = module.get<RateLimiterService>(RateLimiterService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should handle rate limit check via MessagePattern', async () => {
    const result = await controller.handleRateLimit({ ip: '192.168.0.1' });

    expect(result).toEqual({
      allowed: true,
      remaining: 8,
    });

    expect(service.checkSlidingWindow).toHaveBeenCalledWith('192.168.0.1');
  });
});
