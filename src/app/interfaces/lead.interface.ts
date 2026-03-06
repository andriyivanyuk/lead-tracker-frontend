export type LeadStatus = 'new' | 'in_progress' | 'paid' | 'completed';

export type LeadSource =
  | 'instagram'
  | 'telegram'
  | 'viber'
  | 'facebook'
  | 'other';

export type CreateLeadStatus = 'new' | 'in_progress' | 'paid';

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
  summary: LeadsSummary;
}

export interface LeadsSummary {
  new_count?: number;
  in_progress_count?: number;
  paid_count?: number;
  completed_count?: number;
  paid_week_count?: number;
  paid_this_week_count?: number;
  week_paid_count?: number;
  total_amount_minor?: number;
  paid_sum_minor?: number;
  currency_code?: string;
}

export interface CreateLeadRequest {
  title: string | null;
  contact_name: string | null;
  contact_handle: string | null;
  phone: string | null;
  notes: string | null;
  status: CreateLeadStatus;
  source: LeadSource;
  amount_minor: number | null;
  currency_code: string;
  reminder_at: string | null;
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

export interface GetLeadResponse {
  ok: boolean;
  item: Lead;
}

export interface LeadEvent {
  id: number;
  type: string;
  message?: string | null;
  actor_name?: string | null;
  actor_email?: string | null;
  created_at: string;
  note?: string | null;
  from_status?: LeadStatus | null;
  to_status?: LeadStatus | null;
}

export interface GetLeadEventsResponse {
  ok: boolean;
  items?: LeadEvent[];
  events?: LeadEvent[];
}

export interface DeleteLeadResponse {
  ok: boolean;
}
