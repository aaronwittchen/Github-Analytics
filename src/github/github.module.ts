import { Module } from '@nestjs/common';
import { GitHubController } from './github.controller.js';
import { GitHubService } from './github.service.js';
import { GitHubApiService } from './services/github-api.service.js';
import { GitHubCacheService } from './services/github-cache.service.js';
import { GitHubTransformService } from './services/github-transform.service.js';
import { CommonModule } from '../common/common.module.js';

@Module({
  imports: [CommonModule],
  controllers: [GitHubController],
  providers: [
    GitHubService,
    GitHubApiService,
    GitHubCacheService,
    GitHubTransformService,
  ],
  exports: [GitHubService],
})
export class GitHubModule {}
