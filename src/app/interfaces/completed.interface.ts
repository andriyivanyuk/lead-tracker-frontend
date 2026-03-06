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
