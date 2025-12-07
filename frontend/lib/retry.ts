export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  factor?: number;
  jitter?: boolean;
  retryable?: (error: any) => boolean;
}

/**
 * Exponential backoff retry with jitter
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    factor = 2,
    jitter = true,
    retryable = (error) => {
      // Retry on network errors and 5xx errors
      if (!error.response) return true;
      const status = error.response.status;
      return status >= 500 && status < 600;
    },
  } = options;

  let lastError: any;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();
      if (attempt > 1) {
        console.log(`Retry succeeded on attempt ${attempt}`);
      }
      return result;
    } catch (error: any) {
      lastError = error;

      // Check if error is retryable
      if (!retryable(error)) {
        console.warn(`Error not retryable: ${error.message}`);
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxAttempts) {
        console.error(
          `All retry attempts exhausted after ${maxAttempts} attempts`,
        );
        throw error;
      }

      // Calculate delay with exponential backoff
      const baseDelay = Math.min(
        initialDelay * Math.pow(factor, attempt - 1),
        maxDelay,
      );

      // Add jitter (random variation) to prevent thundering herd
      const jitterAmount = jitter ? Math.random() * 0.3 * baseDelay : 0;
      delay = baseDelay + jitterAmount;

      console.warn(
        `Retry attempt ${attempt}/${maxAttempts} failed, retrying in ${Math.round(delay)}ms`,
      );

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Simple retry without backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000,
): Promise<T> {
  return retryWithBackoff(fn, {
    maxAttempts,
    initialDelay: delay,
    factor: 1,
    jitter: false,
  });
}

