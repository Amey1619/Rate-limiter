import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  Logger,
} from '@nestjs/common';
import { RateLimiterService } from './rate-limiter.service';
import { Request } from 'express';

@Injectable()
export class RateLimiterGuard implements CanActivate {
  private readonly logger = new Logger(RateLimiterGuard.name);
  private readonly RATE_LIMIT_TIMEOUT_MS = 5000; // 5s timeout

  constructor(private readonly rateLimiter: RateLimiterService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.log('Checking rate limit...');
    const request = context.switchToHttp().getRequest<Request>();
    const ip = this.extractIp(request);

    if (!ip) {
      this.logger.error('IP address not found in request');
      throw new HttpException('IP address required', 400);
    }

    try {
      const { allowed, remaining } = await Promise.race([
        this.rateLimiter.checkRateLimit(ip),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Rate limit check timed out')),
            this.RATE_LIMIT_TIMEOUT_MS,
          ),
        ),
      ]);

      this.logger.debug(
        `IP: ${ip}, Allowed: ${allowed}, Remaining: ${remaining}`,
      );

      if (!allowed) {
        throw new HttpException('Too Many Requests', 429);
      }

      if (request.res?.set) {
        request.res.set('X-RateLimit-Remaining', remaining.toString());
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Rate limit error for IP ${ip}: ${error.message}`
      );
      throw new HttpException('Rate limit service unavailable', 500);
    }
  }

  private extractIp(request: Request): string | null {
    const forwardedFor = request.headers['x-forwarded-for'];
    let ip: string | null = null;

    if (typeof forwardedFor === 'string') {
      // Extract the first IP from "client, proxy1, proxy2"
      ip = forwardedFor.split(',')[0].trim();
    } else if (request.ip) {
      ip = request.ip;
    }

    return ip || null;
  }
}
