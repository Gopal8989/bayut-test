import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';

// Load opossum at module level using require() - this works correctly with CommonJS
// eslint-disable-next-line @typescript-eslint/no-var-requires
const CircuitBreakerConstructor = require('opossum');

interface CircuitBreakerInstance {
  on(event: string, handler: (...args: any[]) => void): void;
  fire(...args: any[]): Promise<any>;
  status?: { state: string };
  enabled: boolean;
  stats: any;
}

export interface CircuitBreakerOptions {
  timeout?: number;
  errorThresholdPercentage?: number;
  resetTimeout?: number;
  rollingCountTimeout?: number;
  rollingCountBuckets?: number;
  name?: string;
}

@Injectable()
export class CircuitBreakerService {
  private breakers: Map<string, CircuitBreakerInstance> = new Map();

  constructor(private readonly logger: LoggerService) {}

  createCircuitBreaker<T>(
    fn: (...args: any[]) => Promise<T>,
    options: CircuitBreakerOptions = {},
  ): CircuitBreakerInstance {
    const {
      timeout = 3000,
      errorThresholdPercentage = 50,
      resetTimeout = 30000,
      rollingCountTimeout = 60000,
      rollingCountBuckets = 10,
      name = 'default',
    } = options;

    const breakerOptions = {
      timeout,
      errorThresholdPercentage,
      resetTimeout,
      rollingCountTimeout,
      rollingCountBuckets,
      name,
    };

    const breaker = new CircuitBreakerConstructor(fn, breakerOptions);

    // Event handlers
    breaker.on('open', () => {
      this.logger.warn(`Circuit breaker opened: ${name}`, {
        context: 'CircuitBreakerService',
        breaker: name,
        state: 'open',
      });
    });

    breaker.on('halfOpen', () => {
      this.logger.info(`Circuit breaker half-open: ${name}`, {
        context: 'CircuitBreakerService',
        breaker: name,
        state: 'halfOpen',
      });
    });

    breaker.on('close', () => {
      this.logger.info(`Circuit breaker closed: ${name}`, {
        context: 'CircuitBreakerService',
        breaker: name,
        state: 'close',
      });
    });

    breaker.on('failure', (error: Error) => {
      this.logger.error(`Circuit breaker failure: ${name}`, error.stack, {
        context: 'CircuitBreakerService',
        breaker: name,
        error: error.message,
      });
    });

    breaker.on('reject', (error: Error) => {
      this.logger.warn(`Circuit breaker rejected: ${name}`, {
        context: 'CircuitBreakerService',
        breaker: name,
        reason: 'Circuit is open',
      });
    });

    breaker.on('timeout', (error: Error) => {
      this.logger.warn(`Circuit breaker timeout: ${name}`, {
        context: 'CircuitBreakerService',
        breaker: name,
        timeout: timeout,
      });
    });

    this.breakers.set(name, breaker);
    return breaker;
  }

  getBreaker(name: string): CircuitBreakerInstance | undefined {
    return this.breakers.get(name);
  }

  getBreakerStats(name: string) {
    const breaker = this.breakers.get(name);
    if (!breaker) return null;

    return {
      name,
      state: breaker.status?.state || 'unknown',
      enabled: breaker.enabled,
      stats: breaker.stats,
    };
  }

  getAllBreakerStats() {
    const stats: any[] = [];
    this.breakers.forEach((breaker, name) => {
      stats.push(this.getBreakerStats(name));
    });
    return stats;
  }
}

