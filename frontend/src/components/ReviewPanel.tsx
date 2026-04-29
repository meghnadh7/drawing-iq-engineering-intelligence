import React, { useState } from 'react';
import { Download, Copy, Check } from 'lucide-react';
import { Job, BoundingBox } from '../types/extraction';
import { PdfViewer } from './PdfViewer';
import { ExtractionTable } from './ExtractionTable';
import { ConfidenceBadge } from './ConfidenceBadge';
import { useExtractionData } from '../hooks/useExtractionData';
import { getExportUrl } from '../services/api';

interface Props {
  job: Job;
}

export function ReviewPanel({ job }: Props) {
  const [activeBbox, setActiveBbox] = useState<BoundingBox | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'data' | 'json' | 'export'>('data');
  const [copied, setCopied] = useState(false);

  const { extraction, totalFields, highConfidenceFields, needsReviewFields, confidenceAvg } =
    useExtractionData(job);

  const handleFieldClick = (bbox: BoundingBox | null) => {
    setActiveBbox(bbox);
    if (bbox?.page) setCurrentPage(bbox.page);
  };

  const handleCopy = () => {
    if (extraction) {
      navigator.clipboard.writeText(JSON.stringify(extraction, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const tabs = [
    { id: 'data' as const, label: 'Extracted Data' },
    { id: 'json' as const, label: 'Raw JSON' },
    { id: 'export' as const, label: 'Export' },
  ];

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Stats bar */}
      <div className="flex gap-3">
        <div className="flex-1 bg-gray-50 rounded-lg px-4 py-2 text-center">
          <div className="text-xs text-gray-500">Fields Extracted</div>
          <div className="text-xl font-semibold text-gray-800">{totalFields}</div>
        </div>
        <div className="flex-1 bg-green-50 rounded-lg px-4 py-2 text-center">
          <div className="text-xs text-gray-500">High Confidence</div>
          <div className="text-xl font-semibold text-green-700">{highConfidenceFields}</div>
        </div>
        <div className="flex-1 bg-amber-50 rounded-lg px-4 py-2 text-center">
          <div className="text-xs text-gray-500">Needs Review</div>
          <div className="text-xl font-semibold text-amber-700">{needsReviewFields}</div>
        </div>
      </div>

      {/* Main split panel */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 flex-1 min-h-0">
        {/* PDF viewer - left 3 cols */}
        <div className="lg:col-span-3 min-h-[500px]">
          <PdfViewer
            jobId={job.id}
            currentPage={currentPage}
            totalPages={job.page_count || 1}
            onPageChange={setCurrentPage}
            activeBbox={activeBbox}
          />
        </div>

        {/* Right panel - 2 cols */}
        <div className="lg:col-span-2 flex flex-col min-h-0">
          {/* Tab bar */}
          <div className="flex border-b border-gray-200 bg-white rounded-t-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors duration-150 ${
                  activeTab === tab.id
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-auto bg-white rounded-b-lg border border-t-0 border-gray-200">
            {activeTab === 'data' && extraction && (
              <ExtractionTable
                extraction={extraction}
                onFieldHover={setActiveBbox}
                onFieldClick={handleFieldClick}
              />
            )}

            {activeTab === 'json' && (
              <div className="p-3">
                <div className="flex justify-end mb-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-gray-800 text-gray-200 rounded hover:bg-gray-700 transition-colors"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                  </button>
                </div>
                <pre className="bg-gray-900 text-green-400 text-xs p-4 rounded-lg overflow-auto max-h-[60vh] whitespace-pre-wrap">
                  {JSON.stringify(extraction, null, 2)}
                </pre>
              </div>
            )}

            {activeTab === 'export' && (
              <div className="p-6 flex flex-col items-center gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-indigo-600 mb-1">
                    {Math.round(confidenceAvg * 100)}%
                  </div>
                  <div className="text-sm text-gray-500">Overall Extraction Confidence</div>
                  <div className="mt-2">
                    <ConfidenceBadge confidence={confidenceAvg} size="md" />
                  </div>
                </div>

                <div className="w-full space-y-3">
                  <a
                    href={getExportUrl(job.id, 'json')}
                    download="extraction.json"
                    className="flex items-center gap-3 w-full px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Download size={18} />
                    <div>
                      <div className="text-sm font-semibold">Download JSON</div>
                      <div className="text-xs opacity-75">Full extraction data</div>
                    </div>
                  </a>

                  <a
                    href={getExportUrl(job.id, 'csv')}
                    download="bom-export.csv"
                    className="flex items-center gap-3 w-full px-5 py-3 bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-200 rounded-lg font-medium transition-colors"
                  >
                    <Download size={18} />
                    <div>
                      <div className="text-sm font-semibold">Download CSV (BOM)</div>
                      <div className="text-xs text-gray-500">Bill of Materials only</div>
                    </div>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
