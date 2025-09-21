import { Controller, Get, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Response } from 'express';
import { Registry, collectDefaultMetrics } from 'prom-client';

@Controller('metrics')
@ApiExcludeController()
export class MetricsController {
  @Get()
  async getMetrics(@Res() res: Response): Promise<void> {
    const register = new Registry();
    register.setDefaultLabels({
      app: 'github-analytics-api',
    });
    
    // Collect default Node.js and process metrics
    collectDefaultMetrics({ register });
    
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.send(metrics);
  }
}
