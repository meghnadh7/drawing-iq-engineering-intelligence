import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Cpu } from 'lucide-react';
import { ReviewPanel } from '../components/ReviewPanel';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import { getJob, getExportUrl } from '../services/api';
import { Job } from '../types/extraction';

export function ReviewPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    getJob(jobId)
      .then((data) => {
        setJob(data);
        setError(null);
        // If not done yet, redirect to processing
        if (data.status !== 'DONE') {
          navigate(`/processing/${jobId}`, { replace: true });
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load job');
      })
      .finally(() => setLoading(false));
  }, [jobId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <svg className="animate-spin h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-md p-8 text-center max-w-sm">
          <p className="text-red-500 mb-4">{error || 'Job not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const confidenceAvg = job.extraction?.confidence_avg ?? 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Sticky header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 shadow-sm px-6 py-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 rounded-lg p-1">
              <Cpu size={14} className="text-white" />
            </div>
            <span className="font-bold text-indigo-700">DrawingIQ</span>
          </div>
        </div>

        <div className="flex-1 mx-6 hidden md:block">
          <p className="text-sm text-gray-700 font-medium truncate text-center max-w-md mx-auto">
            {job.original_name}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ConfidenceBadge confidence={confidenceAvg} size="md" />
          <a
            href={getExportUrl(job.id, 'json')}
            download="extraction.json"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <Download size={13} />
            Export
          </a>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 overflow-hidden">
        <ReviewPanel job={job} />
      </main>
    </div>
  );
}
