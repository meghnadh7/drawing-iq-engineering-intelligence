import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server';
import Groq from 'groq-sdk';
import * as fs from 'fs';
import * as path from 'path';
import {
  DrawingExtraction,
  BomItem,
  KeyDimension,
  GdtCallout,
} from '../types/extraction.types';
import { EXTRACTION_PROMPT } from './extraction.prompts';

@Injectable()
export class ExtractionService {
  private readonly logger = new Logger(ExtractionService.name);
  private readonly geminiModel: any;
  private readonly fileManager: GoogleAIFileManager;
  private readonly groq: Groq;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    const genAI = new GoogleGenerativeAI(this.apiKey);
    this.geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    this.fileManager = new GoogleAIFileManager(this.apiKey);
    this.groq = new Groq({
      apiKey: this.configService.get<string>('GROQ_API_KEY') || '',
    });
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private cleanJsonResponse(raw: string): string {
    let cleaned = raw.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
    else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
    if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
    }
    return cleaned.trim();
  }

  private getEmptySkeleton(): DrawingExtraction {
    return {
      document_meta: { title: null, drawing_number: null, revision: null, date: null, scale: null, units: null, confidence: 0 },
      bom_items: [],
      key_dimensions: [],
      gdt_callouts: [],
      title_block: { company: null, drawn_by: null, checked_by: null, approved_by: null, material: null, surface_finish: null, confidence: 0 },
    };
  }

  private parseExtraction(raw: string): DrawingExtraction | null {
    try {
      const cleaned = this.cleanJsonResponse(raw);
      const parsed = JSON.parse(cleaned);
      if (!parsed.document_meta) return null;
      return parsed as DrawingExtraction;
    } catch {
      return null;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }

  // Retry wrapper — respects Retry-After from 429 responses
  private async withRetry<T>(fn: () => Promise<T>, label: string, maxRetries = 3): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        const is429 = err?.message?.includes('429') || err?.status === 429;
        if (is429 && attempt < maxRetries) {
          // Extract retry delay from error if present, otherwise exponential backoff
          const retryMatch = err.message?.match(/Please retry in (\d+)s/);
          const waitSec = retryMatch ? parseInt(retryMatch[1]) + 2 : Math.pow(2, attempt + 1) * 10;
          this.logger.warn(`[${label}] Rate limited (429). Waiting ${waitSec}s before retry ${attempt + 1}/${maxRetries}...`);
          await this.sleep(waitSec * 1000);
        } else {
          throw err;
        }
      }
    }
    throw new Error(`${label} failed after ${maxRetries} retries`);
  }

  // ─── PRIMARY: Gemini Files API (1 call for entire PDF) ──────────────────────

  private async extractWithGeminiFilesApi(filePath: string): Promise<string> {
    this.logger.log(`Uploading PDF to Gemini Files API: ${path.basename(filePath)}`);

    const uploadResult = await this.fileManager.uploadFile(filePath, {
      mimeType: 'application/pdf',
      displayName: path.basename(filePath),
    });

    // Poll until file is ACTIVE (can take a few seconds for large PDFs)
    let file = uploadResult.file;
    let waitAttempts = 0;
    while (file.state === FileState.PROCESSING && waitAttempts < 30) {
      this.logger.log(`File state: PROCESSING — waiting 2s... (attempt ${waitAttempts + 1})`);
      await this.sleep(2000);
      const refreshed = await this.fileManager.getFile(file.name);
      file = refreshed;
      waitAttempts++;
    }

    if (file.state === FileState.FAILED) {
      throw new Error('Gemini file processing FAILED');
    }

    if (file.state !== FileState.ACTIVE) {
      throw new Error(`File stuck in state: ${file.state}`);
    }

    this.logger.log(`File ACTIVE at ${file.uri} — running extraction...`);

    const result = await this.withRetry(
      () =>
        this.geminiModel.generateContent([
          { fileData: { fileUri: file.uri, mimeType: 'application/pdf' } },
          { text: EXTRACTION_PROMPT },
        ]),
      'Gemini Files API generateContent',
      3,
    );

    // Clean up the uploaded file to stay within free tier storage limits
    try {
      await this.fileManager.deleteFile(file.name);
      this.logger.log('Uploaded file deleted from Gemini storage');
    } catch {
      // non-fatal
    }

    return (result as any).response.text();
  }

  // ─── FALLBACK: Rasterise with pdf2pic + send as inline image ────────────────
  // Only used if Files API fails. Sends FIRST PAGE ONLY to avoid rate limits.

  private async rasterizeFirstPage(filePath: string): Promise<string | null> {
    try {
      const { fromPath } = await import('pdf2pic');
      const convert = fromPath(filePath, {
        density: 200,
        format: 'png',
        width: 2000,
        height: 2000,
        saveFilename: 'page',
        savePath: '/tmp',
      });
      const result = await convert(1, { responseType: 'buffer' });
      if (result && result.buffer) {
        return (result.buffer as Buffer).toString('base64');
      }
      return null;
    } catch (err) {
      this.logger.warn(`Rasterization failed (ImageMagick may not be installed): ${err.message}`);
      return null;
    }
  }

  private async extractWithGeminiInline(base64Image: string): Promise<string> {
    const result = await this.withRetry(
      () =>
        this.geminiModel.generateContent([
          { inlineData: { mimeType: 'image/png', data: base64Image } },
          { text: EXTRACTION_PROMPT },
        ]),
      'Gemini inline',
      3,
    );
    return (result as any).response.text();
  }

  private async extractWithGroq(base64Image: string): Promise<string> {
    const completion = await this.groq.chat.completions.create({
      model: 'llama-3.2-11b-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:image/png;base64,${base64Image}` } },
            { type: 'text', text: EXTRACTION_PROMPT },
          ] as any,
        },
      ],
      response_format: { type: 'json_object' },
    });
    return completion.choices[0].message.content || '{}';
  }

  // ─── Main entry point ────────────────────────────────────────────────────────

  async extractFromPdf(filePath: string, _pageCount: number): Promise<DrawingExtraction> {
    // Strategy 1 — Gemini Files API: upload PDF once, single generateContent call
    try {
      this.logger.log('Strategy 1: Gemini Files API (single call for whole PDF)');
      const raw = await this.extractWithGeminiFilesApi(filePath);
      const result = this.parseExtraction(raw);
      if (result) {
        this.logger.log('✅ Gemini Files API extraction succeeded');
        return result;
      }
      this.logger.warn('Gemini Files API returned unparseable JSON, trying fallback');
      this.logger.warn('Raw response snippet: ' + raw.slice(0, 200));
    } catch (err: any) {
      this.logger.warn(`Strategy 1 failed: ${err.message}`);
    }

    // Strategy 2 — Rasterise first page + Gemini inline (needs ImageMagick)
    try {
      this.logger.log('Strategy 2: Rasterise first page + Gemini inline');
      const base64 = await this.rasterizeFirstPage(filePath);
      if (base64) {
        const raw = await this.extractWithGeminiInline(base64);
        const result = this.parseExtraction(raw);
        if (result) {
          this.logger.log('✅ Gemini inline (rasterized) extraction succeeded');
          return result;
        }
      }
    } catch (err: any) {
      this.logger.warn(`Strategy 2 failed: ${err.message}`);
    }

    // Strategy 3 — Rasterise first page + Groq LLaMA Vision fallback
    try {
      this.logger.log('Strategy 3: Rasterise first page + Groq LLaMA fallback');
      const base64 = await this.rasterizeFirstPage(filePath);
      if (base64) {
        const raw = await this.extractWithGroq(base64);
        const result = this.parseExtraction(raw);
        if (result) {
          this.logger.log('✅ Groq fallback extraction succeeded');
          return result;
        }
      }
    } catch (err: any) {
      this.logger.warn(`Strategy 3 failed: ${err.message}`);
    }

    this.logger.error('All extraction strategies failed — returning empty skeleton');
    return this.getEmptySkeleton();
  }

  // Kept for backward compat
  async extractFromImage(base64Image: string, pageNumber: number): Promise<DrawingExtraction> {
    try {
      const raw = await this.extractWithGeminiInline(base64Image);
      const result = this.parseExtraction(raw);
      if (result) return result;
    } catch (err: any) {
      this.logger.warn(`extractFromImage Gemini failed page ${pageNumber}: ${err.message}`);
    }
    try {
      const raw = await this.extractWithGroq(base64Image);
      const result = this.parseExtraction(raw);
      if (result) return result;
    } catch (err: any) {
      this.logger.error(`extractFromImage Groq failed page ${pageNumber}: ${err.message}`);
    }
    return this.getEmptySkeleton();
  }

  calculateAverageConfidence(extraction: DrawingExtraction): number {
    const confidences: number[] = [];
    if (extraction.document_meta?.confidence != null) confidences.push(extraction.document_meta.confidence);
    if (extraction.title_block?.confidence != null) confidences.push(extraction.title_block.confidence);
    (extraction.bom_items || []).forEach((i) => { if (i.confidence != null) confidences.push(i.confidence); });
    (extraction.key_dimensions || []).forEach((d) => { if (d.confidence != null) confidences.push(d.confidence); });
    (extraction.gdt_callouts || []).forEach((g) => { if (g.confidence != null) confidences.push(g.confidence); });
    if (confidences.length === 0) return 0;
    return confidences.reduce((s, c) => s + c, 0) / confidences.length;
  }
}
