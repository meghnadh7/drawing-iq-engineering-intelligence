import axios from 'axios';
import { Job } from '../types/extraction';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function uploadPdf(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<{ job_id: string; filename: string; status: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post(`${BASE_URL}/api/jobs`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded * 100) / event.total));
      }
    },
  });
  return response.data;
}

export async function getJob(id: string): Promise<Job> {
  const response = await axios.get(`${BASE_URL}/api/jobs/${id}`);
  return response.data;
}

export async function getAllJobs(): Promise<Job[]> {
  const response = await axios.get(`${BASE_URL}/api/jobs`);
  return response.data;
}

export async function updateReview(id: string, editedFields: any[]): Promise<void> {
  await axios.patch(`${BASE_URL}/api/jobs/${id}/review`, {
    edited_fields: editedFields,
  });
}

export async function deleteJob(id: string): Promise<void> {
  await axios.delete(`${BASE_URL}/api/jobs/${id}`);
}

export function getExportUrl(id: string, format: 'json' | 'csv'): string {
  return `${BASE_URL}/api/jobs/${id}/export?format=${format}`;
}

export function getPdfUrl(id: string): string {
  return `${BASE_URL}/api/jobs/${id}/file`;
}
