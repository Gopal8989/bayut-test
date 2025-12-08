import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { PropertyModule } from './property/property.module';
import { EmailModule } from './email/email.module';
import { UploadModule } from './upload/upload.module';
import { LoggerModule } from './common/logger/logger.module';
import { CircuitBreakerModule } from './common/circuit-breaker/circuit-breaker.module';
import { RetryModule } from './common/retry/retry.module';
import { CacheModule } from './common/cache/cache.module';
import { QueueModule } from './common/queue/queue.module';
import { MetricsModule } from './common/metrics/metrics.module';
import { HealthController } from './common/controllers/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot({
      throttlers: [{
        ttl: 60000,
        limit: 100,
      }],
    }),
    PrismaModule,
    LoggerModule,
    CircuitBreakerModule,
    RetryModule,
    CacheModule,
    QueueModule,
    MetricsModule,
    UserModule,
    AuthModule,
    PropertyModule,
    EmailModule,
    UploadModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
