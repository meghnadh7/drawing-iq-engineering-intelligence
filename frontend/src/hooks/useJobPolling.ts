import { useState, useEffect, useRef } from 'react';
import { Job } from '../types/extraction';
import { getJob } from '../services/api';

export function useJobPolling(jobId: string | null) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!jobId) return;

    setLoading(true);

    const fetchJob = async () => {
      try {
        const data = await getJob(jobId);
        setJob(data);
        setError(null);
        if (data.status === 'DONE' || data.status === 'FAILED') {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setLoading(false);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch job');
        setLoading(false);
      }
    };

    fetchJob();
    intervalRef.current = setInterval(fetchJob, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [jobId]);

  return { job, loading, error };
}
