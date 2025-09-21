import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CommonModule } from './common/common.module.js';
import { GitHubModule } from './github/github.module.js';
import { HealthModule } from './health/health.module.js';
import { PrometheusModule } from './prometheus/prometheus.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Rate limiting configuration
    ThrottlerModule.forRoot([{
      ttl: 60000, // Time window in milliseconds (1 minute)
      limit: 10,   // Maximum number of requests within the TTL window
    }]),
    CacheModule.register({
      ttl: 300, // 5 minutes
      max: 100, // maximum number of items in cache
      isGlobal: true,
    }),
    CommonModule,
    GitHubModule,
    HealthModule,
    PrometheusModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
