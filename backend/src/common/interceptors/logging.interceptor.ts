import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const startTime = Date.now();

    this.logger.http(`Incoming Request: ${method} ${url}`, {
      ip,
      userAgent,
      body: method !== 'GET' ? request.body : undefined,
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const duration = Date.now() - startTime;

          this.logger.http(`Outgoing Response: ${method} ${url}`, {
            statusCode,
            duration: `${duration}ms`,
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(`Request Failed: ${method} ${url}`, error.stack, {
            ip,
            userAgent,
            duration: `${duration}ms`,
            error: error.message,
          });
        },
      }),
    );
  }
}


