import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';
import { LoggerModule } from '../logger/logger.module';
import * as cacheManager from 'cache-manager';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          ttl: configService.get('CACHE_TTL', 300) * 1000, // Convert to milliseconds
          max: configService.get('CACHE_MAX', 100), // max 100 items
        };
      },
      inject: [ConfigService],
    }),
    LoggerModule,
  ],
  providers: [CacheService],
  exports: [CacheService, NestCacheModule],
})
export class CacheModule {}

