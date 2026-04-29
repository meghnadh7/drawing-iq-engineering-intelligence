import React from 'react';
import { Clock, CheckCircle, XCircle, Zap } from 'lucide-react';
import { Job } from '../types/extraction';

interface Props {
  job: Job;
}

export function JobStatus({ job }: Props) {
  const statusConfig = {
    QUEUED: {
      icon: <Clock size={40} className="text-gray-400" />,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      message: 'Waiting in queue...',
    },
    PROCESSING: {
      icon: (
        <svg className="animate-spin h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      message: 'Reading PDF pages...',
    },
    EXTRACTING: {
      icon: <Zap size={40} className="text-indigo-500 animate-pulse" />,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      message: 'AI is extracting data...',
    },
    VALIDATING: {
      icon: <CheckCircle size={40} className="text-purple-500" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      message: 'Validating results...',
    },
    DONE: {
      icon: <CheckCircle size={40} className="text-green-500" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      message: 'Extraction complete!',
    },
    FAILED: {
      icon: <XCircle size={40} className="text-red-500" />,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      message: 'Extraction failed',
    },
  };

  const config = statusConfig[job.status] || statusConfig.QUEUED;
  const showProgress = ['PROCESSING', 'EXTRACTING', 'VALIDATING'].includes(job.status);

  return (
    <div className="bg-white shadow-md rounded-xl p-8 flex flex-col items-center max-w-md w-full">
      <div className={`rounded-full p-4 ${config.bgColor} mb-4`}>
        {config.icon}
      </div>

      <h2 className={`text-xl font-semibold ${config.color} mb-1`}>
        {config.message}
      </h2>

      {job.page_count > 0 && (
        <p className="text-sm text-gray-400 mb-4">
          Processing {job.page_count}-page drawing
        </p>
      )}

      {showProgress && (
        <div className="w-full mt-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progress</span>
            <span>{job.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${job.progress}%` }}
            />
          </div>
        </div>
      )}

      {job.status === 'FAILED' && job.error && (
        <p className="mt-4 text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2 text-center max-w-sm">
          {job.error}
        </p>
      )}
    </div>
  );
}
