import { Module, Global } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { LoggerModule } from '../logger/logger.module';

@Global()
@Module({
  imports: [LoggerModule],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}

