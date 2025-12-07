import { Module, Global } from '@nestjs/common';
import { CircuitBreakerService } from './circuit-breaker.service';
import { LoggerModule } from '../logger/logger.module';

@Global()
@Module({
  imports: [LoggerModule],
  providers: [CircuitBreakerService],
  exports: [CircuitBreakerService],
})
export class CircuitBreakerModule {}

