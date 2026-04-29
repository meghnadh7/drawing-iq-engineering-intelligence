import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  getUploadDir(): string {
    return process.env.UPLOAD_DIR || './uploads';
  }

  async saveFile(file: Express.Multer.File): Promise<string> {
    const uploadDir = this.getUploadDir();
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filename = uuid() + '.pdf';
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, file.buffer);
    return filePath;
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      this.logger.error(`Failed to delete file ${filePath}: ${err.message}`);
    }
  }

  async getFileBuffer(filePath: string): Promise<Buffer> {
    return fs.readFileSync(filePath) as Buffer;
  }
}
