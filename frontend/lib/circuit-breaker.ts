export interface CircuitBreakerOptions {
  timeout?: number;
  errorThresholdPercentage?: number;
  resetTimeout?: number;
  name?: string;
}

export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'halfOpen';
  failures: number;
  successes: number;
  lastFailureTime?: number;
}

export class CircuitBreaker {
  private state: CircuitBreakerState = {
    state: 'closed',
    failures: 0,
    successes: 0,
  };
  private options: Required<CircuitBreakerOptions>;
  private readonly failureThreshold: number;

  constructor(
    private fn: (...args: any[]) => Promise<any>,
    options: CircuitBreakerOptions = {},
  ) {
    this.options = {
      timeout: options.timeout || 5000,
      errorThresholdPercentage: options.errorThresholdPercentage || 50,
      resetTimeout: options.resetTimeout || 30000,
      name: options.name || 'default',
    };
    this.failureThreshold = Math.ceil(
      (this.options.errorThresholdPercentage / 100) * 10,
    );
  }

  async fire(...args: any[]): Promise<any> {
    if (this.state.state === 'open') {
      if (Date.now() - (this.state.lastFailureTime || 0) > this.options.resetTimeout) {
        this.state.state = 'halfOpen';
        console.log(`[CircuitBreaker:${this.options.name}] State changed to halfOpen`);
      } else {
        throw new Error(
          `Circuit breaker is open. Too many failures. Please try again later.`,
        );
      }
    }

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), this.options.timeout);
      });

      const result = await Promise.race([this.fn(...args), timeoutPromise]);

      // Success
      if (this.state.state === 'halfOpen') {
        this.state.state = 'closed';
        this.state.failures = 0;
        this.state.successes = 0;
        console.log(`[CircuitBreaker:${this.options.name}] State changed to closed`);
      } else {
        this.state.successes++;
        if (this.state.successes >= 5) {
          this.state.failures = 0;
        }
      }

      return result;
    } catch (error: any) {
      this.state.failures++;
      this.state.lastFailureTime = Date.now();

      if (this.state.failures >= this.failureThreshold) {
        this.state.state = 'open';
        console.error(
          `[CircuitBreaker:${this.options.name}] State changed to open after ${this.state.failures} failures`,
        );
      }

      throw error;
    }
  }

  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  reset(): void {
    this.state = {
      state: 'closed',
      failures: 0,
      successes: 0,
    };
    console.log(`[CircuitBreaker:${this.options.name}] Reset`);
  }
}

