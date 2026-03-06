import {
  CreateLeadRequest,
  CreateLeadStatus,
  LeadSource,
} from '../../interfaces/lead.interface';

export interface CreateLeadFormValue {
  title: string;
  contact_name: string;
  contact_handle: string;
  phone: string;
  notes: string;
  status?: CreateLeadStatus;
  source?: LeadSource;
  amount_minor: number | null;
  currency_code?: string;
  reminder_at?: string | null;
}

export function mapCreateLeadFormToPayload(
  form: CreateLeadFormValue,
): CreateLeadRequest {
  return {
    title: normalizeNullableText(form.title),
    contact_name: normalizeNullableText(form.contact_name),
    contact_handle: normalizeNullableText(form.contact_handle),
    phone: normalizeNullableText(form.phone),
    notes: normalizeNullableText(form.notes),
    status: form.status ?? 'new',
    source: form.source ?? 'other',
    amount_minor: form.amount_minor ?? null,
    currency_code: normalizeRequiredText(form.currency_code, 'UAH'),
    reminder_at: normalizeNullableText(form.reminder_at),
  };
}

function normalizeNullableText(
  value: string | null | undefined,
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeRequiredText(
  value: string | null | undefined,
  fallback: string,
): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return fallback;
  }

  return trimmed;
}
