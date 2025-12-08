import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CircuitBreakerService } from '../circuit-breaker/circuit-breaker.service';
import { MetricsService } from '../metrics/metrics.service';
import { QueueService } from '../queue/queue.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly metricsService: MetricsService,
    private readonly queueService: QueueService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Health check',
    description: 'Check if the API is running and healthy',
  })
  @ApiResponse({
    status: 200,
    description: 'API is healthy',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  getHealth() {
    return {
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
      },
      status: 'success',
      success: true,
    };
  }

  @Get('metrics')
  @ApiOperation({
    summary: 'Get performance metrics',
    description: 'Retrieve system performance metrics including circuit breaker stats, request counts, and response times',
  })
  @ApiResponse({
    status: 200,
    description: 'Metrics retrieved successfully',
  })
  getMetrics() {
    return {
      data: {
        circuitBreakers: this.circuitBreakerService.getAllBreakerStats(),
        metrics: {
          propertyQueries: this.metricsService.getCounter('property.queries.total'),
          propertyCreated: this.metricsService.getCounter('property.created'),
          propertyUpdated: this.metricsService.getCounter('property.updated'),
          propertyDeleted: this.metricsService.getCounter('property.deleted'),
          httpRequests: this.metricsService.getCounter('http.requests.total'),
          httpErrors: this.metricsService.getCounter('http.requests.errors'),
        },
        histograms: {
          propertyQueryDuration: this.metricsService.getHistogramStats('property.query.duration'),
          httpRequestDuration: this.metricsService.getHistogramStats('http.request.duration'),
        },
      },
      status: 'success',
      success: true,
    };
  }

  @Get('circuit-breakers')
  @ApiOperation({
    summary: 'Get circuit breaker status',
    description: 'Retrieve the current status of all circuit breakers in the system',
  })
  @ApiResponse({
    status: 200,
    description: 'Circuit breaker status retrieved successfully',
  })
  getCircuitBreakers() {
    return {
      data: {
        items: this.circuitBreakerService.getAllBreakerStats(),
      },
      status: 'success',
      success: true,
    };
  }
}

