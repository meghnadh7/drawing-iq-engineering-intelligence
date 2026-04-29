import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Trash2, Eye, Cpu, Grid, Ruler } from 'lucide-react';
import { UploadZone } from '../components/UploadZone';
import { getAllJobs, deleteJob } from '../services/api';
import { Job } from '../types/extraction';

export function HomePage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  const loadJobs = async () => {
    setLoadingJobs(true);
    try {
      const data = await getAllJobs();
      setJobs(data);
    } catch {
      // silently ignore
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleSuccess = (jobId: string) => {
    navigate(`/processing/${jobId}`);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteJob(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
    } catch {
      // ignore
    }
  };

  const statusBadge = (status: Job['status']) => {
    const map: Record<string, string> = {
      DONE: 'bg-green-100 text-green-700',
      FAILED: 'bg-red-100 text-red-700',
      QUEUED: 'bg-gray-100 text-gray-600',
      PROCESSING: 'bg-blue-100 text-blue-700',
      EXTRACTING: 'bg-indigo-100 text-indigo-700',
      VALIDATING: 'bg-purple-100 text-purple-700',
    };
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status] || 'bg-gray-100 text-gray-600'}`}>
        {status}
      </span>
    );
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-10 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 rounded-lg p-1.5">
            <Cpu size={18} className="text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-indigo-700">DrawingIQ</span>
            <span className="text-xs text-gray-400 ml-2 hidden sm:inline">Engineering Intelligence</span>
          </div>
        </div>
        <span className="text-xs text-gray-400 hidden md:block">
          Powered by Gemini 1.5 Flash · Free tier
        </span>
      </header>

      {/* Hero */}
      <section className="py-16 px-6 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 max-w-2xl mx-auto leading-tight">
          Turn Engineering Drawings into{' '}
          <span className="text-indigo-600">Structured Data</span>
        </h1>
        <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto mb-6">
          Upload a PDF drawing or BOM. Get extracted dimensions, BOM items,
          and GD&amp;T callouts in seconds.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {[
            { icon: <FileText size={13} />, label: 'PDF Support' },
            { icon: <Grid size={13} />, label: 'BOM Extraction' },
            { icon: <Ruler size={13} />, label: 'GD&T Recognition' },
          ].map((f) => (
            <span
              key={f.label}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-indigo-200 text-indigo-700 bg-indigo-50"
            >
              {f.icon}
              {f.label}
            </span>
          ))}
        </div>
        <UploadZone onSuccess={handleSuccess} />
      </section>

      {/* Recent jobs */}
      {jobs.length > 0 && (
        <section className="px-6 pb-16 max-w-4xl mx-auto w-full">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Extractions</h2>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">File</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-indigo-400 shrink-0" />
                        <span className="text-gray-800 truncate max-w-[200px] font-medium">
                          {job.original_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{statusBadge(job.status)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">
                      {formatDate(job.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {job.status === 'DONE' && (
                          <button
                            onClick={() => navigate(`/review/${job.id}`)}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                          >
                            <Eye size={12} />
                            View
                          </button>
                        )}
                        {['PROCESSING', 'EXTRACTING', 'VALIDATING', 'QUEUED'].includes(job.status) && (
                          <button
                            onClick={() => navigate(`/processing/${job.id}`)}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                          >
                            Processing…
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
