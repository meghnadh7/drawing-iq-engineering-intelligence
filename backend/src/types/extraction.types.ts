export interface BoundingBox {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DocumentMeta {
  title: string | null;
  drawing_number: string | null;
  revision: string | null;
  date: string | null;
  scale: string | null;
  units: string | null;
  confidence: number;
}

export interface BomItem {
  item_number: string;
  part_number: string | null;
  description: string;
  quantity: number | null;
  material: string | null;
  finish: string | null;
  notes: string | null;
  confidence: number;
  bbox: BoundingBox | null;
}

export interface KeyDimension {
  label: string;
  value: string;
  unit: string;
  tolerance_upper: string | null;
  tolerance_lower: string | null;
  confidence: number;
  bbox: BoundingBox | null;
}

export interface GdtCallout {
  symbol: string;
  tolerance: string;
  datum_reference: string | null;
  confidence: number;
  bbox: BoundingBox | null;
}

export interface TitleBlock {
  company: string | null;
  drawn_by: string | null;
  checked_by: string | null;
  approved_by: string | null;
  material: string | null;
  surface_finish: string | null;
  confidence: number;
}

export interface DrawingExtraction {
  document_meta: DocumentMeta;
  bom_items: BomItem[];
  key_dimensions: KeyDimension[];
  gdt_callouts: GdtCallout[];
  title_block: TitleBlock;
}
