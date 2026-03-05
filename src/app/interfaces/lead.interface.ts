export type LeadStatus = 'new' | 'in_progress' | 'paid' | 'completed';

export type LeadSource =
  | 'instagram'
  | 'telegram'
  | 'viber'
  | 'facebook'
  | 'other';

export interface Lead {
  id: number;
  status: LeadStatus;
  title: string | null;
  contact_name: string | null;
  contact_handle: string | null;
  phone: string | null;
  notes: string | null;
  source: LeadSource | null;
  amount_minor: number | null;
  currency_code: string | null;
  reminder_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GetLeadsResponse {
  ok: boolean;
  items?: Lead[];
  leads?: Lead[];
}

export interface GetLeadsSummaryResponse {
  ok: boolean;
  summary: Record<string, number>;
}

export interface CreateLeadRequest {
  title: string | null;
  contact_name: string | null;
  contact_handle: string | null;
  phone: string | null;
  notes: string | null;
  status?: LeadStatus;
  source?: LeadSource;
  amount_minor?: number | null;
  currency_code?: string;
  reminder_at?: string | null;
}

export interface UpdateLeadRequest {
  title?: string | null;
  contact_name?: string | null;
  contact_handle?: string | null;
  phone?: string | null;
  notes?: string | null;
  status?: LeadStatus;
  source?: LeadSource;
  amount_minor?: number | null;
  currency_code?: string;
  reminder_at?: string | null;
}

export interface MoveLeadRequest {
  status: LeadStatus;
}

export interface LeadItemResponse {
  ok: boolean;
  item: Lead;
}

export interface DeleteLeadResponse {
  ok: boolean;
}
