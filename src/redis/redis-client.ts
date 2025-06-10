import {
  ClientProxyFactory,
  Transport,
  ClientProxy,
  RedisOptions,
} from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

interface RateLimitResponse {
  allowed: boolean;
  retryAfter?: number;
}

async function main() {
  // npx ts-node src/redis/redis-client.ts
  // to run this script
  const redisOptions: RedisOptions = {
    transport: Transport.REDIS,
    options: {
      host: "localhost",
      port: 6379,
    },
  };

  const client: ClientProxy = ClientProxyFactory.create(redisOptions);

  try {
    await client.connect();

    const response: RateLimitResponse = await lastValueFrom(
      client.send({ cmd: 'check_rate_limit' }, { ip: '127.0.0.1' }),
    );

    console.log('✅ Response from microservice:', response);
  } catch (error: any) {
    console.error('❌ Error sending message:', error);
  } finally {
    await client.close();
  }
}

main();
