import { Module, Global } from '@nestjs/common';
import { QueueService } from './queue.service';
import { LoggerModule } from '../logger/logger.module';

@Global()
@Module({
  imports: [LoggerModule],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}

