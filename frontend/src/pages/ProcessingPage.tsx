import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { JobStatus } from '../components/JobStatus';
import { useJobPolling } from '../hooks/useJobPolling';

export function ProcessingPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { job, error } = useJobPolling(jobId ?? null);

  useEffect(() => {
    if (!job) return;
    if (job.status === 'DONE') {
      const timer = setTimeout(() => navigate(`/review/${jobId}`), 1500);
      return () => clearTimeout(timer);
    }
  }, [job?.status, jobId, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Back button top-left */}
      <div className="absolute top-4 left-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        {job ? (
          <>
            <JobStatus job={job} />
            {job.status === 'DONE' && (
              <p className="mt-4 text-sm text-gray-400 animate-pulse">
                Redirecting to review…
              </p>
            )}
            {job.status === 'FAILED' && (
              <button
                onClick={() => navigate('/')}
                className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Try Again
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm text-gray-400">Connecting…</span>
          </div>
        )}
      </div>
    </div>
  );
}
