import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ExtractionService } from './extraction.service';

@Module({
  imports: [ConfigModule],
  providers: [ExtractionService],
  exports: [ExtractionService],
})
export class ExtractionModule {}
