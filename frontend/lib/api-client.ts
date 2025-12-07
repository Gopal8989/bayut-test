import api, { getErrorMessage } from './api';
import { CircuitBreaker } from './circuit-breaker';
import { retryWithBackoff } from './retry';

/**
 * Enhanced API client with circuit breaker and retry logic
 */
export class ApiClient {
  private circuitBreaker: CircuitBreaker;

  constructor() {
    this.circuitBreaker = new CircuitBreaker(
      async (config: any) => {
        return api(config);
      },
      {
        name: 'api-client',
        timeout: 10000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000,
      },
    );
  }

  /**
   * Make request with circuit breaker and retry
   */
  async request<T>(config: any): Promise<T> {
    try {
      const response = await retryWithBackoff(
        () => this.circuitBreaker.fire(config),
        {
          maxAttempts: 3,
          initialDelay: 1000,
          factor: 2,
          retryable: (error) => {
            // Don't retry on 4xx errors except 429
            if (error.response) {
              const status = error.response.status;
              return status === 429 || (status >= 500 && status < 600);
            }
            // Retry on network errors
            return true;
          },
        },
      );
      return response.data;
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * GET request
   */
  async get<T>(url: string, config?: any): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  /**
   * POST request
   */
  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, config?: any): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  /**
   * Get circuit breaker state
   */
  getCircuitBreakerState() {
    return this.circuitBreaker.getState();
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker() {
    this.circuitBreaker.reset();
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

