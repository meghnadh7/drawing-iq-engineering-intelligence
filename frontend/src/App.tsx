import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { pdfjs } from 'react-pdf';
import { HomePage } from './pages/HomePage';
import { ProcessingPage } from './pages/ProcessingPage';
import { ReviewPage } from './pages/ReviewPage';

pdfjs.GlobalWorkerOptions.workerSrc =
  'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/processing/:jobId" element={<ProcessingPage />} />
        <Route path="/review/:jobId" element={<ReviewPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
