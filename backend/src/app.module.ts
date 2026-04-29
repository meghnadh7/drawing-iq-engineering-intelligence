import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { ExtractionModule } from './extraction/extraction.module';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({
      connection: (() => {
        const redisUrl = new URL(
          process.env.REDIS_URL || 'redis://localhost:6379',
        );
        return {
          host: redisUrl.hostname,
          port: parseInt(redisUrl.port) || 6379,
          ...(redisUrl.password ? { password: redisUrl.password } : {}),
          ...(redisUrl.username && redisUrl.username !== 'default'
            ? { username: redisUrl.username }
            : {}),
        };
      })(),
    }),
    PrismaModule,
    StorageModule,
    ExtractionModule,
    JobsModule,
  ],
})
export class AppModule {}
