import {
  ReqLimiterService,
  ReqLimiterOptions,
  ReqLimiterResult,
} from './reqlimiter.service';
import Redis from 'ioredis';

const mockEval = jest.fn();
const mockGet = jest.fn();
const mockSet = jest.fn();
const mockExpire = jest.fn();
const mockIncr = jest.fn();

const redisMock = {
  eval: mockEval,
  get: mockGet,
  set: mockSet,
  expire: mockExpire,
  incr: mockIncr,
} as unknown as Redis;

describe('ReqLimiterService', () => {
  const baseOptions: ReqLimiterOptions = {
    redisClient: redisMock,
    windowSize: 60,
    maxRequests: 5,
    abuseThreshold: 3,
    abuseWindow: 60,
    banDuration: 600,
  };

  let limiter: ReqLimiterService;

  beforeEach(() => {
    jest.clearAllMocks();
    limiter = new ReqLimiterService(baseOptions);
  });

  it('should throw if no redis client is provided', () => {
    expect(() => new ReqLimiterService({} as any)).toThrow(
      'Redis client is required to initialize RateLimiterService.',
    );
  });

  it('should allow request when under limit', async () => {
    mockGet.mockResolvedValue(null); // not banned
    mockEval.mockResolvedValue([1, 3]); // allowed, 3 remaining

    const result: ReqLimiterResult = await limiter.check('1.2.3.4');
    expect(result).toEqual({ allowed: true, remaining: 3 });
    expect(mockEval).toHaveBeenCalled();
  });

  it('should block request and track abuse', async () => {
    mockGet.mockResolvedValue(null); // not banned
    mockEval.mockResolvedValue([0, 0]); // blocked
    mockIncr.mockResolvedValue(2); // 2 violations

    const result: ReqLimiterResult = await limiter.check('5.6.7.8');
    expect(result).toEqual({ allowed: false, remaining: 0 });
    expect(mockIncr).toHaveBeenCalledWith('abuse:5.6.7.8');
  });

  it('should ban user after abuse threshold is exceeded', async () => {
    mockGet.mockResolvedValue(null); // not banned
    mockEval.mockResolvedValue([0, 0]); // blocked
    mockIncr.mockResolvedValue(3); // hits abuse threshold
    mockSet.mockResolvedValue('OK');

    const result = await limiter.check('9.9.9.9');
    expect(result).toEqual({ allowed: false, remaining: 0 });
    expect(mockSet).toHaveBeenCalledWith('ban:9.9.9.9', '1', 'EX', 600);
  });

  it('should block request if already banned', async () => {
    mockGet.mockResolvedValue('1'); // banned

    const result = await limiter.check('10.0.0.1');
    expect(result).toEqual({ allowed: false, remaining: 0 });
    expect(mockEval).not.toHaveBeenCalled();
  });

  it('should handle Redis error gracefully', async () => {
    mockGet.mockResolvedValue(null); // not banned
    mockEval.mockRejectedValue(new Error('Redis down'));

    const result = await limiter.check('127.0.0.1');
    expect(result).toEqual({ allowed: false, remaining: 0 });
  });
});
