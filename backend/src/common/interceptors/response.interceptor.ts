import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface StandardResponse<T> {
  data: T;
  message?: string;
  status: string;
  success: boolean;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, StandardResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<StandardResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If response is already in standard format, return as is
        if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
          return data;
        }

        // For array responses (list endpoints)
        if (Array.isArray(data)) {
          return {
            data: {
              items: data,
            },
            status: 'success',
            success: true,
          };
        }

        // For paginated responses
        if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
          return {
            data: {
              items: data.data,
              total: data.total || data.data.length,
              page: data.page || 1,
              limit: data.limit || data.data.length,
              totalPages: data.totalPages || 1,
            },
            status: 'success',
            success: true,
          };
        }

        // For single object responses
        return {
          data: data || {},
          status: 'success',
          success: true,
        };
      }),
    );
  }
}

