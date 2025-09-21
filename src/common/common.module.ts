import { Module } from '@nestjs/common';
import { GitHubConfigService } from './config/github-config.service.js';
import { GitHubValidators } from './validators/github.validators.js';

@Module({
  providers: [GitHubConfigService, GitHubValidators],
  exports: [GitHubConfigService, GitHubValidators],
})
export class CommonModule {}
