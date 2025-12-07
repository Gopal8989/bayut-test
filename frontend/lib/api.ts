import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { getAuthToken, getRefreshToken, setAuthToken, setRefreshToken, removeAuthToken } from './auth';
import { CircuitBreaker } from './circuit-breaker';
import { retryWithBackoff } from './retry';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Create circuit breakers for different endpoints
const apiCircuitBreaker = new CircuitBreaker(
  async (config: InternalAxiosRequestConfig) => {
    return axios(config);
  },
  {
    name: 'api-requests',
    timeout: 10000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
  },
);

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // Don't set Content-Type for FormData, let browser set it with boundary
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Token refresh function
const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/refresh`,
      { refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (response.data.access_token) {
      setAuthToken(response.data.access_token);
      if (response.data.refresh_token) {
        setRefreshToken(response.data.refresh_token);
      }
      return response.data.access_token;
    }
    return null;
  } catch (error) {
    removeAuthToken();
    return null;
  }
};

// Response interceptor with error handling and retry logic
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response) {
      const { status, data } = error.response;
      
      // Handle 401 Unauthorized - try to refresh token
      if (status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        const newToken = await refreshAccessToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
        
        // If refresh fails, clear tokens and redirect
        if (typeof window !== 'undefined') {
          removeAuthToken();
          if (!window.location.pathname.includes('/login') && 
              !window.location.pathname.includes('/register')) {
            window.location.href = '/login';
          }
        }
      }
      
      // Handle 429 Too Many Requests - retry with backoff
      if (status === 429 && !originalRequest._retry) {
        originalRequest._retry = true;
        const message = (data as any)?.message || 'Too many requests. Please try again later.';
        console.warn('Rate limit exceeded, retrying with backoff:', message);
        
        try {
          return await retryWithBackoff(() => api(originalRequest), {
            maxAttempts: 3,
            initialDelay: 2000,
            factor: 2,
          });
        } catch (retryError) {
          console.error('Retry failed after rate limit:', retryError);
        }
      }
      
      // Handle 500+ server errors - retry with backoff
      if (status >= 500 && !originalRequest._retry && originalRequest.method !== 'get') {
        originalRequest._retry = true;
        console.warn(`Server error ${status}, retrying with backoff`);
        
        try {
          return await retryWithBackoff(() => api(originalRequest), {
            maxAttempts: 3,
            initialDelay: 1000,
            factor: 2,
          });
        } catch (retryError) {
          console.error('Retry failed after server error:', retryError);
        }
      }
      
      // Handle 403 Forbidden
      if (status === 403) {
        console.error('Access forbidden:', (data as any)?.message || 'You do not have permission to access this resource');
      }
    } else if (error.request) {
      // Network error - retry with backoff
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        console.warn('Network error, retrying with backoff');
        
        try {
          return await retryWithBackoff(() => api(originalRequest), {
            maxAttempts: 3,
            initialDelay: 1000,
            factor: 2,
          });
        } catch (retryError) {
          console.error('Retry failed after network error:', retryError);
        }
      } else {
        console.error('Network error: No response received from server');
      }
    } else {
      // Something happened in setting up the request
      console.error('Request error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;

// Helper function to extract error message
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.data) {
      const data = axiosError.response.data as any;
      return data.message || data.error || 'An error occurred';
    }
    if (axiosError.request) {
      return 'Network error. Please check your connection.';
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

