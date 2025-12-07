import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { ExecutionContext } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  constructor(
    options: any,
    storageService: any,
    reflector: any,
  ) {
    super(options, storageService, reflector);
  }

  async throwThrottlingException(context: ExecutionContext): Promise<void> {
    throw new ThrottlerException('Too many requests, please try again later');
  }
}


