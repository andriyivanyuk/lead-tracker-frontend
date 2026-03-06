import { LeadSource } from './lead.interface';

export interface CompletedItem {
  id: number;
  title: string | null;
  contact_name: string | null;
  contact_handle: string | null;
  phone: string | null;
  notes: string | null;
  source: LeadSource | null;
  amount_minor: number | null;
  currency_code: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GetCompletedResponse {
  ok: boolean;
  items: CompletedItem[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface GetCompletedSummaryResponse {
  ok: boolean;
  summary: CompletedSummary;
}

export interface CompletedSummary {
  completed_count?: number;
  total_count?: number;
  success_count?: number;
  refused_count?: number;
  no_response_count?: number;
  other_count?: number;
  total_amount_minor?: number;
  currency_code?: string;
}

export type CompletedReason = 'success' | 'refused' | 'no_response' | 'other';

export type CompletedSort = 'completed_at_desc' | 'completed_at_asc';

export type ExportJobStatus = 'queued' | 'processing' | 'ready' | 'failed';

export interface CompletedFilters {
  date_from?: string;
  date_to?: string;
  reason?: CompletedReason;
  q?: string;
}

export interface CompletedListQuery extends CompletedFilters {
  sort?: CompletedSort;
  page?: number;
  page_size?: number;
}

export interface ExportJob {
  id: string;
  status: ExportJobStatus;
  file_name: string | null;
  file_url: string | null;
  created_at: string;
  updated_at: string;
  error_message?: string | null;
}

export interface CreateCompletedExportResponse {
  ok: boolean;
  export_job?: ExportJob;
  job?: ExportJob;
  id?: string;
}

export interface GetExportsResponse {
  ok: boolean;
  items?: ExportJob[];
  jobs?: ExportJob[];
}

export interface ExportDownloadResult {
  blob: Blob;
  fileName: string | null;
}
