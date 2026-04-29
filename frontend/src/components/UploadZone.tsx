import React, { useState, useRef } from 'react';
import { FileText, Upload } from 'lucide-react';
import { uploadPdf } from '../services/api';

interface Props {
  onSuccess: (jobId: string) => void;
}

export function UploadZone({ onSuccess }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (f: File): string | null => {
    if (f.type !== 'application/pdf') return 'Only PDF files are accepted.';
    if (f.size > 50 * 1024 * 1024) return 'File size must be under 50 MB.';
    return null;
  };

  const handleFileSelect = (f: File) => {
    const err = validateFile(f);
    if (err) {
      setError(err);
      setFile(null);
      return;
    }
    setError(null);
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFileSelect(selected);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    try {
      const data = await uploadPdf(file, setUploadProgress);
      onSuccess(data.job_id);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`relative min-h-[300px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 cursor-pointer transition-all duration-200
          ${dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 bg-white hover:border-indigo-300 hover:bg-gray-50'}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleChange}
          disabled={uploading}
        />

        <FileText
          size={48}
          className={`mb-4 ${dragOver ? 'text-indigo-500' : 'text-indigo-400'}`}
        />
        <p className="text-lg font-semibold text-gray-700 mb-1">
          Drop your engineering drawing PDF here
        </p>
        <p className="text-sm text-gray-400 mb-4">or click to browse files</p>

        {file && (
          <div className="mb-4 flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2">
            <FileText size={16} className="text-indigo-600 shrink-0" />
            <span className="text-sm text-indigo-800 font-medium truncate max-w-xs">
              {file.name}
            </span>
            <span className="text-xs text-indigo-500 shrink-0">
              ({formatSize(file.size)})
            </span>
          </div>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); handleUpload(); }}
          disabled={!file || uploading}
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-150 flex items-center gap-2"
        >
          {uploading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Uploading...
            </>
          ) : (
            <>
              <Upload size={16} />
              Extract Data
            </>
          )}
        </button>

        {uploading && (
          <div className="w-full max-w-xs mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Uploading</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600 text-center">{error}</p>
      )}
    </div>
  );
}
