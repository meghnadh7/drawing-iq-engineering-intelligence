import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Res,
  NotFoundException,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { memoryStorage } from 'multer';
import { Response } from 'express';
import * as fs from 'fs';
import { JobsService } from './jobs.service';
import { StorageService } from '../storage/storage.service';

@Controller('api/jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly storageService: StorageService,
    @InjectQueue('extraction-queue') private readonly queue: Queue,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are accepted');
    }

    const filePath = await this.storageService.saveFile(file);
    const job = await this.jobsService.createJob(
      file.originalname,
      file.originalname,
      filePath,
    );

    await this.queue.add('process-pdf', { jobId: job.id });

    return {
      job_id: job.id,
      filename: job.filename,
      status: job.status,
    };
  }

  @Get()
  async getAllJobs() {
    return this.jobsService.getAllJobs();
  }

  @Get(':id')
  async getJob(@Param('id') id: string) {
    return this.jobsService.getJob(id);
  }

  @Get(':id/file')
  async getFile(@Param('id') id: string, @Res() res: Response) {
    const job = await this.jobsService.getJob(id);
    if (!job.file_path || !fs.existsSync(job.file_path)) {
      throw new NotFoundException('PDF file not found');
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    const stream = fs.createReadStream(job.file_path);
    stream.pipe(res);
  }

  @Patch(':id/review')
  async reviewJob(
    @Param('id') id: string,
    @Body() body: { edited_fields: any[] },
  ) {
    await this.jobsService.updateExtraction(id, body.edited_fields || []);
    return { success: true };
  }

  @Delete(':id')
  async deleteJob(@Param('id') id: string) {
    await this.jobsService.deleteJob(id);
    return { success: true };
  }

  @Get(':id/export')
  async exportJob(
    @Param('id') id: string,
    @Query('format') format: string,
    @Res() res: Response,
  ) {
    const job = await this.jobsService.getJob(id);
    if (!job.extraction) {
      throw new NotFoundException('No extraction data for this job');
    }

    const structured = job.extraction.structured as any;

    if (format === 'csv') {
      const headers = 'Item,Part Number,Description,Quantity,Material,Finish,Notes,Confidence\n';
      const rows = (structured.bom_items || [])
        .map((item: any) => {
          const escape = (v: any) => {
            if (v == null) return '';
            const s = String(v);
            return s.includes(',') || s.includes('"') || s.includes('\n')
              ? `"${s.replace(/"/g, '""')}"`
              : s;
          };
          return [
            escape(item.item_number),
            escape(item.part_number),
            escape(item.description),
            escape(item.quantity),
            escape(item.material),
            escape(item.finish),
            escape(item.notes),
            escape(item.confidence),
          ].join(',');
        })
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=bom-export.csv');
      res.send(headers + rows);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=extraction.json');
      res.send(JSON.stringify(structured, null, 2));
    }
  }
}
