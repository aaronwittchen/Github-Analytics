import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GitHubModule } from './github/github.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    GitHubModule,
  ],
})
export class AppModule {}
