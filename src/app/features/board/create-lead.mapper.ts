import {
  CreateLeadRequest,
  CreateLeadStatus,
  LeadSource,
} from '../../interfaces/lead.interface';

export interface CreateLeadFormValue {
  name: string;
  company: string;
  contact: string;
  notes: string;
  phone: string;
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
    title: normalizeNullableText(form.company),
    contact_name: normalizeNullableText(form.name),
    contact_handle: normalizeNullableText(form.contact),
    phone: normalizeNullableText(form.phone),
    notes: normalizeNullableText(form.notes),
    status: form.status ?? 'new',
    source: form.source ?? 'other',
    amount_minor: form.amount_minor,
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
