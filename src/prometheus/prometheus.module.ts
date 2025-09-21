import { Module } from '@nestjs/common';
import { PrometheusModule as PromClientModule } from '@willsoto/nestjs-prometheus';
import { MetricsController } from './metrics.controller.js';

@Module({
  imports: [
    PromClientModule.register({
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
  controllers: [MetricsController],
  exports: [PromClientModule],
})
export class PrometheusModule {}
