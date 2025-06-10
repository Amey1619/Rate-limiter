import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';

describe('RedisService', () => {
  let service: RedisService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [RedisService],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  afterAll(async () => {
    // Disconnect Redis properly to prevent test leaks
    await service.getClient().disconnect();
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
