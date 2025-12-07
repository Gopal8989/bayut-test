import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const route = `${method} ${url}`;

          // Record metrics
          this.metricsService.recordMetric('http.request.duration', duration, {
            method,
            route,
          });
          this.metricsService.recordHistogram('http.request.duration', duration, {
            method,
            route,
          });
          this.metricsService.incrementCounter('http.requests.total', 1, {
            method,
            route,
          });
        },
        error: () => {
          const duration = Date.now() - startTime;
          const route = `${method} ${url}`;

          this.metricsService.recordMetric('http.request.error', 1, {
            method,
            route,
          });
          this.metricsService.incrementCounter('http.requests.errors', 1, {
            method,
            route,
          });
        },
      }),
    );
  }
}

