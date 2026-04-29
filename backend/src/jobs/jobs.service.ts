import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async createJob(
    filename: string,
    originalName: string,
    filePath: string,
  ): Promise<any> {
    return this.prisma.job.create({
      data: {
        filename,
        original_name: originalName,
        file_path: filePath,
        status: 'QUEUED',
      },
    });
  }

  async getJob(id: string): Promise<any> {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: { extraction: true },
    });
    if (!job) {
      throw new NotFoundException(`Job ${id} not found`);
    }
    return job;
  }

  async getAllJobs(): Promise<any[]> {
    return this.prisma.job.findMany({
      orderBy: { created_at: 'desc' },
      include: { extraction: true },
    });
  }

  async updateJobStatus(
    id: string,
    status: string,
    progress?: number,
    error?: string,
  ): Promise<void> {
    await this.prisma.job.update({
      where: { id },
      data: {
        status: status as any,
        progress: progress ?? 0,
        ...(error ? { error } : {}),
      },
    });
  }

  async updateJobPageCount(id: string, pageCount: number): Promise<void> {
    await this.prisma.job.update({
      where: { id },
      data: { page_count: pageCount },
    });
  }

  async saveExtraction(
    jobId: string,
    extraction: any,
    raw: any,
    confidenceAvg: number,
  ): Promise<any> {
    const saved = await this.prisma.extraction.create({
      data: {
        job_id: jobId,
        raw_result: raw,
        structured: extraction,
        confidence_avg: confidenceAvg,
      },
    });
    await this.prisma.job.update({
      where: { id: jobId },
      data: { status: 'DONE', progress: 100 },
    });
    return saved;
  }

  async updateExtraction(jobId: string, editedFields: any[]): Promise<void> {
    await this.prisma.extraction.update({
      where: { job_id: jobId },
      data: {
        edited_fields: editedFields,
        reviewed: true,
      },
    });
  }

  async deleteJob(id: string): Promise<void> {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (job) {
      await this.prisma.job.delete({ where: { id } });
      try {
        if (job.file_path && fs.existsSync(job.file_path)) {
          fs.unlinkSync(job.file_path);
        }
      } catch (e) {
        // silently ignore file deletion errors
      }
    }
  }
}
