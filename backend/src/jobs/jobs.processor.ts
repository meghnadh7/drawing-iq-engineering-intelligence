import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { JobsService } from './jobs.service';
import { ExtractionService } from '../extraction/extraction.service';
import { StorageService } from '../storage/storage.service';

@Processor('extraction-queue')
export class JobsProcessor extends WorkerHost {
  private readonly logger = new Logger(JobsProcessor.name);

  constructor(
    private readonly jobsService: JobsService,
    private readonly extractionService: ExtractionService,
    private readonly storageService: StorageService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    const { jobId } = job.data;
    try {
      await this.jobsService.updateJobStatus(jobId, 'PROCESSING', 10);

      const jobRecord = await this.jobsService.getJob(jobId);

      let pageCount = 1;
      try {
        const buffer = await this.storageService.getFileBuffer(jobRecord.file_path);
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(buffer);
        pageCount = pdfData.numpages || 1;
      } catch (err) {
        this.logger.warn(`Could not parse PDF for page count: ${err.message}. Defaulting to 1.`);
        pageCount = 1;
      }

      await this.jobsService.updateJobPageCount(jobId, pageCount);
      await this.jobsService.updateJobStatus(jobId, 'EXTRACTING', 30);

      const extraction = await this.extractionService.extractFromPdf(
        jobRecord.file_path,
        pageCount,
      );

      await this.jobsService.updateJobStatus(jobId, 'VALIDATING', 80);

      const confidenceAvg = this.extractionService.calculateAverageConfidence(extraction);

      await this.jobsService.saveExtraction(jobId, extraction, extraction, confidenceAvg);

      this.logger.log(`Job ${jobId} completed with confidence ${confidenceAvg.toFixed(2)}`);
    } catch (error) {
      this.logger.error(`Job ${jobId} failed: ${error.message}`, error.stack);
      await this.jobsService.updateJobStatus(jobId, 'FAILED', 0, error.message);
    }
  }
}
