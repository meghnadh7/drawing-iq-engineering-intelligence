import React, { useState, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { BoundingBox } from '../types/extraction';
import { getPdfUrl } from '../services/api';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc =
  'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

interface Props {
  jobId: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  activeBbox: BoundingBox | null;
}

export function PdfViewer({ jobId, currentPage, totalPages, onPageChange, activeBbox }: Props) {
  const [pageWidth, setPageWidth] = useState(600);
  const [pageHeight, setPageHeight] = useState(800);
  const [loadError, setLoadError] = useState(false);
  const [numPages, setNumPages] = useState(totalPages || 1);
  const containerRef = useRef<HTMLDivElement>(null);

  const onDocumentLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
    setLoadError(false);
  }, []);

  const onDocumentLoadError = useCallback(() => {
    setLoadError(true);
  }, []);

  const onPageLoadSuccess = useCallback((page: any) => {
    setPageWidth(page.width);
    setPageHeight(page.height);
  }, []);

  const effectiveTotalPages = numPages || totalPages || 1;

  if (loadError) {
    return (
      <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 m-4 rounded-lg p-8">
          <FileText size={48} className="text-gray-400 mb-4" />
          <p className="text-gray-600 font-medium mb-1">PDF preview unavailable</p>
          <p className="text-gray-400 text-sm text-center">
            PDF preview unavailable — extraction data shown on right
          </p>
        </div>
        <div className="flex items-center justify-center gap-4 py-3 border-t">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="p-1 rounded disabled:opacity-30 hover:bg-gray-100"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {effectiveTotalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(effectiveTotalPages, currentPage + 1))}
            disabled={currentPage >= effectiveTotalPages}
            className="p-1 rounded disabled:opacity-30 hover:bg-gray-100"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex-1 overflow-auto flex items-start justify-center p-2 bg-gray-50">
        <div ref={containerRef} className="relative">
          <Document
            file={getPdfUrl(jobId)}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex flex-col items-center justify-center w-[600px] h-[800px]">
                <svg className="animate-spin h-8 w-8 text-indigo-500 mb-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm text-gray-500">Loading PDF...</span>
              </div>
            }
          >
            <Page
              pageNumber={currentPage}
              width={580}
              onLoadSuccess={onPageLoadSuccess}
              renderAnnotationLayer={false}
              renderTextLayer={false}
            />
          </Document>

          {activeBbox && activeBbox.page === currentPage && (
            <svg
              className="absolute top-0 left-0 pointer-events-none"
              width={pageWidth}
              height={pageHeight}
              style={{ width: '100%', height: '100%' }}
            >
              <rect
                x={activeBbox.x * pageWidth}
                y={activeBbox.y * pageHeight}
                width={activeBbox.width * pageWidth}
                height={activeBbox.height * pageHeight}
                fill="rgba(251, 191, 36, 0.3)"
                stroke="#f59e0b"
                strokeWidth="2"
                className="bbox-highlight"
              />
            </svg>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 py-3 border-t bg-white">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="p-1 rounded disabled:opacity-30 hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm text-gray-600 font-medium">
          Page {currentPage} of {effectiveTotalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(effectiveTotalPages, currentPage + 1))}
          disabled={currentPage >= effectiveTotalPages}
          className="p-1 rounded disabled:opacity-30 hover:bg-gray-100 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
