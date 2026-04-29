import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { DrawingExtraction, BoundingBox } from '../types/extraction';
import { ConfidenceBadge } from './ConfidenceBadge';

interface Props {
  extraction: DrawingExtraction;
  onFieldHover: (bbox: BoundingBox | null) => void;
  onFieldClick: (bbox: BoundingBox | null) => void;
}

function SectionHeader({
  title,
  count,
  confidence,
  open,
  onToggle,
}: {
  title: string;
  count: number;
  confidence: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between border-b py-3 px-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={onToggle}
    >
      <div className="flex items-center gap-2">
        <span className="font-semibold text-gray-800 text-sm">{title}</span>
        <span className="bg-gray-200 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
          {count}
        </span>
        {confidence > 0 && <ConfidenceBadge confidence={confidence} size="sm" />}
      </div>
      {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
    </div>
  );
}

export function ExtractionTable({ extraction, onFieldHover, onFieldClick }: Props) {
  const [openDoc, setOpenDoc] = useState(true);
  const [openBom, setOpenBom] = useState(true);
  const [openDims, setOpenDims] = useState(true);
  const [openGdt, setOpenGdt] = useState(true);

  const { document_meta: dm, title_block: tb, bom_items, key_dimensions, gdt_callouts } = extraction;

  const docFields = [
    { label: 'Title', value: dm?.title },
    { label: 'Drawing Number', value: dm?.drawing_number },
    { label: 'Revision', value: dm?.revision },
    { label: 'Date', value: dm?.date },
    { label: 'Scale', value: dm?.scale },
    { label: 'Units', value: dm?.units },
    { label: 'Company', value: tb?.company },
    { label: 'Drawn By', value: tb?.drawn_by },
    { label: 'Checked By', value: tb?.checked_by },
    { label: 'Approved By', value: tb?.approved_by },
    { label: 'Material', value: tb?.material },
    { label: 'Surface Finish', value: tb?.surface_finish },
  ];

  const docConfidence = Math.max(dm?.confidence ?? 0, tb?.confidence ?? 0);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden text-sm">
      {/* Section 1 - Document Info */}
      <SectionHeader
        title="Document Info"
        count={docFields.filter((f) => f.value != null).length}
        confidence={docConfidence}
        open={openDoc}
        onToggle={() => setOpenDoc((p) => !p)}
      />
      {openDoc && (
        <div className="divide-y divide-gray-100">
          {docFields.map((f) => (
            <div key={f.label} className="flex px-4 py-2 hover:bg-gray-50">
              <span className="text-gray-500 w-1/3 shrink-0">{f.label}</span>
              <span className="text-gray-900 flex-1 font-medium">{f.value ?? '—'}</span>
            </div>
          ))}
        </div>
      )}

      {/* Section 2 - BOM */}
      <SectionHeader
        title="Bill of Materials"
        count={bom_items?.length ?? 0}
        confidence={
          bom_items?.length
            ? bom_items.reduce((s, i) => s + (i.confidence ?? 0), 0) / bom_items.length
            : 0
        }
        open={openBom}
        onToggle={() => setOpenBom((p) => !p)}
      />
      {openBom && (
        <>
          {!bom_items?.length ? (
            <p className="text-gray-400 text-sm text-center py-4 px-4">
              No BOM table detected in this drawing
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 uppercase tracking-wide">
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Part No.</th>
                    <th className="px-3 py-2 text-left">Description</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-left">Material</th>
                    <th className="px-3 py-2 text-center">Conf.</th>
                  </tr>
                </thead>
                <tbody>
                  {bom_items.map((item, i) => (
                    <tr
                      key={i}
                      className="border-t border-gray-100 hover:bg-indigo-50 cursor-pointer transition-colors duration-150"
                      onMouseEnter={() => onFieldHover(item.bbox)}
                      onMouseLeave={() => onFieldHover(null)}
                      onClick={() => onFieldClick(item.bbox)}
                    >
                      <td className="px-3 py-2 text-gray-500">{item.item_number ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-700 font-mono">{item.part_number ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-800 max-w-[120px] truncate">{item.description ?? '—'}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{item.quantity ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-600">{item.material ?? '—'}</td>
                      <td className="px-3 py-2 text-center">
                        <ConfidenceBadge confidence={item.confidence ?? 0} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Section 3 - Key Dimensions */}
      <SectionHeader
        title="Key Dimensions"
        count={key_dimensions?.length ?? 0}
        confidence={
          key_dimensions?.length
            ? key_dimensions.reduce((s, d) => s + (d.confidence ?? 0), 0) / key_dimensions.length
            : 0
        }
        open={openDims}
        onToggle={() => setOpenDims((p) => !p)}
      />
      {openDims && (
        <>
          {!key_dimensions?.length ? (
            <p className="text-gray-400 text-sm text-center py-4 px-4">
              No dimensions detected
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 uppercase tracking-wide">
                    <th className="px-3 py-2 text-left">Label</th>
                    <th className="px-3 py-2 text-left">Value</th>
                    <th className="px-3 py-2 text-left">Unit</th>
                    <th className="px-3 py-2 text-left">Tolerance</th>
                    <th className="px-3 py-2 text-center">Conf.</th>
                  </tr>
                </thead>
                <tbody>
                  {key_dimensions.map((dim, i) => (
                    <tr
                      key={i}
                      className="border-t border-gray-100 hover:bg-indigo-50 cursor-pointer transition-colors duration-150"
                      onMouseEnter={() => onFieldHover(dim.bbox)}
                      onMouseLeave={() => onFieldHover(null)}
                      onClick={() => onFieldClick(dim.bbox)}
                    >
                      <td className="px-3 py-2 text-gray-700">{dim.label ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-800 font-mono font-medium">{dim.value ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-600">{dim.unit ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-500 font-mono">
                        {dim.tolerance_upper || dim.tolerance_lower
                          ? `${dim.tolerance_upper ?? ''}/${dim.tolerance_lower ?? ''}`
                          : '—'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <ConfidenceBadge confidence={dim.confidence ?? 0} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Section 4 - GD&T */}
      <SectionHeader
        title="GD&T Callouts"
        count={gdt_callouts?.length ?? 0}
        confidence={
          gdt_callouts?.length
            ? gdt_callouts.reduce((s, g) => s + (g.confidence ?? 0), 0) / gdt_callouts.length
            : 0
        }
        open={openGdt}
        onToggle={() => setOpenGdt((p) => !p)}
      />
      {openGdt && (
        <>
          {!gdt_callouts?.length ? (
            <p className="text-gray-400 text-sm text-center py-4 px-4">
              No GD&T callouts detected
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 uppercase tracking-wide">
                    <th className="px-3 py-2 text-left">Symbol</th>
                    <th className="px-3 py-2 text-left">Tolerance</th>
                    <th className="px-3 py-2 text-left">Datum Ref</th>
                    <th className="px-3 py-2 text-center">Conf.</th>
                  </tr>
                </thead>
                <tbody>
                  {gdt_callouts.map((gdt, i) => (
                    <tr
                      key={i}
                      className="border-t border-gray-100 hover:bg-indigo-50 cursor-pointer transition-colors duration-150"
                      onMouseEnter={() => onFieldHover(gdt.bbox)}
                      onMouseLeave={() => onFieldHover(null)}
                      onClick={() => onFieldClick(gdt.bbox)}
                    >
                      <td className="px-3 py-2 text-gray-800 font-mono font-medium">{gdt.symbol ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-700 font-mono">{gdt.tolerance ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-600">{gdt.datum_reference ?? '—'}</td>
                      <td className="px-3 py-2 text-center">
                        <ConfidenceBadge confidence={gdt.confidence ?? 0} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
