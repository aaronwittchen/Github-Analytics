import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { GitHubModule } from './github/github.module.js';

@Module({
  imports: [GitHubModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
