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
  summary: Record<string, number>;
}
