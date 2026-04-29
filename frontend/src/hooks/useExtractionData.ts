import { useMemo } from 'react';
import { Job, DrawingExtraction } from '../types/extraction';

export function useExtractionData(job: Job | null) {
  return useMemo(() => {
    if (!job?.extraction) {
      return {
        extraction: null,
        totalFields: 0,
        highConfidenceFields: 0,
        needsReviewFields: 0,
        confidenceAvg: 0,
        hasData: false,
      };
    }

    const extraction: DrawingExtraction = job.extraction.structured;

    const allConfidences: number[] = [];

    // document_meta: 6 fields
    const metaFields = ['title', 'drawing_number', 'revision', 'date', 'scale', 'units'];
    metaFields.forEach(() => {
      allConfidences.push(extraction.document_meta?.confidence ?? 0);
    });

    // title_block: 6 fields
    const tbFields = ['company', 'drawn_by', 'checked_by', 'approved_by', 'material', 'surface_finish'];
    tbFields.forEach(() => {
      allConfidences.push(extraction.title_block?.confidence ?? 0);
    });

    (extraction.bom_items || []).forEach((item) => {
      allConfidences.push(item.confidence ?? 0);
    });
    (extraction.key_dimensions || []).forEach((dim) => {
      allConfidences.push(dim.confidence ?? 0);
    });
    (extraction.gdt_callouts || []).forEach((gdt) => {
      allConfidences.push(gdt.confidence ?? 0);
    });

    const totalFields = allConfidences.length;
    const highConfidenceFields = allConfidences.filter((c) => c >= 0.9).length;
    const needsReviewFields = allConfidences.filter((c) => c < 0.7).length;
    const confidenceAvg = job.extraction.confidence_avg ?? 0;

    const hasData =
      extraction != null &&
      ((extraction.bom_items || []).length > 0 ||
        (extraction.key_dimensions || []).length > 0);

    return {
      extraction,
      totalFields,
      highConfidenceFields,
      needsReviewFields,
      confidenceAvg,
      hasData,
    };
  }, [job]);
}
