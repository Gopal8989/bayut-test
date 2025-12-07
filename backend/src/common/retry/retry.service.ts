import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  factor?: number;
  jitter?: boolean;
  retryableErrors?: (error: any) => boolean;
}

@Injectable()
export class RetryService {
  constructor(private readonly logger: LoggerService) {}

  /**
   * Exponential backoff retry with jitter
   */
  async retryWithBackoff<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {},
  ): Promise<T> {
    const {
      maxAttempts = 3,
      initialDelay = 1000,
      maxDelay = 10000,
      factor = 2,
      jitter = true,
      retryableErrors = (error) => {
        // Retry on network errors and 5xx errors
        return (
          !error.response ||
          (error.response.status >= 500 && error.response.status < 600)
        );
      },
    } = options;

    let lastError: any;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await fn();
        
        if (attempt > 1) {
          this.logger.info(`Retry succeeded on attempt ${attempt}`, {
            context: 'RetryService',
            attempts: attempt,
          });
        }
        
        return result;
      } catch (error: any) {
        lastError = error;

        // Check if error is retryable
        if (!retryableErrors(error)) {
          this.logger.warn(`Error not retryable: ${error.message}`, {
            context: 'RetryService',
            attempt,
          });
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === maxAttempts) {
          this.logger.error(
            `All retry attempts exhausted after ${maxAttempts} attempts`,
            error.stack,
            {
              context: 'RetryService',
              attempts: maxAttempts,
            },
          );
          throw error;
        }

        // Calculate delay with exponential backoff
        const baseDelay = Math.min(initialDelay * Math.pow(factor, attempt - 1), maxDelay);
        
        // Add jitter (random variation) to prevent thundering herd
        const jitterAmount = jitter ? Math.random() * 0.3 * baseDelay : 0;
        delay = baseDelay + jitterAmount;

        this.logger.warn(
          `Retry attempt ${attempt}/${maxAttempts} failed, retrying in ${Math.round(delay)}ms`,
          {
            context: 'RetryService',
            attempt,
            maxAttempts,
            delay: Math.round(delay),
            error: error.message,
          },
        );

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Retry with custom strategy
   */
  async retry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000,
  ): Promise<T> {
    return this.retryWithBackoff(fn, {
      maxAttempts,
      initialDelay: delay,
      factor: 1,
      jitter: false,
    });
  }
}

