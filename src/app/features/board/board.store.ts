import { Injectable, computed, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { CompletedApi } from '../../core/api/completed.api';
import { LeadsApi } from '../../core/api/leads.api';
import {
  CreateLeadRequest,
  Lead,
  LeadEvent,
  GetLeadEventsResponse,
  GetLeadsResponse,
  LeadsSummary,
  LeadStatus,
  UpdateLeadRequest,
} from '../../interfaces/lead.interface';
import { CompletedSummary } from '../../interfaces/completed.interface';

export const BOARD_STATUSES: LeadStatus[] = [
  'new',
  'in_progress',
  'paid',
  'completed',
];

@Injectable({ providedIn: 'root' })
export class BoardStore {
  private readonly _leads = signal<Lead[]>([]);
  private readonly _summary = signal<BoardSummary>({});
  private readonly _loading = signal(false);
  private readonly _detailsLoading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _movingLeadId = signal<number | null>(null);
  private readonly _creating = signal(false);
  private readonly _selectedLeadDetails = signal<Lead | null>(null);
  private readonly _selectedLeadEvents = signal<LeadEvent[]>([]);

  readonly leads = this._leads.asReadonly();
  readonly summary = this._summary.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly detailsLoading = this._detailsLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly movingLeadId = this._movingLeadId.asReadonly();
  readonly creating = this._creating.asReadonly();
  readonly selectedLeadDetails = this._selectedLeadDetails.asReadonly();
  readonly selectedLeadEvents = this._selectedLeadEvents.asReadonly();
  readonly statuses = computed(() => BOARD_STATUSES);

  constructor(
    private readonly leadsApi: LeadsApi,
    private readonly completedApi: CompletedApi,
  ) {}

  async loadBoard(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const [leadsResponse, summaryResponse, completedSummaryResponse] =
        await Promise.all([
          firstValueFrom(this.leadsApi.getLeads()),
          firstValueFrom(this.leadsApi.getLeadsSummary()),
          firstValueFrom(
            this.completedApi.getCompletedSummary(this.currentMonthFilters()),
          ),
        ]);

      this._leads.set(
        this.extractLeads(leadsResponse).filter(
          (lead) => lead.status !== 'completed',
        ),
      );

      this._summary.set({
        ...summaryResponse.summary,
        completed_count: this.extractCompletedCount(
          completedSummaryResponse.summary,
        ),
      });
    } catch {
      this._error.set('Не вдалося завантажити дані дошки.');
    } finally {
      this._loading.set(false);
    }
  }

  leadsByStatus(status: LeadStatus): Lead[] {
    return this._leads().filter((lead) => lead.status === status);
  }

  summaryCountByStatus(status: LeadStatus): number {
    const key = `${status}_count`;
    const value = this.summaryValue(key);

    if (typeof value === 'number') {
      return value;
    }

    return this.leadsByStatus(status).length;
  }

  paidWeekCount(): number {
    return this.getNumericSummaryByKeys([
      'paid_week_count',
      'paid_this_week_count',
      'week_paid_count',
    ]);
  }

  totalAmountMinor(): number {
    return this.getNumericSummaryByKeys(['total_amount_minor']);
  }

  totalAmountCurrency(): string {
    const value = this._summary().currency_code;
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }

    return 'UAH';
  }

  async moveLead(leadId: number, status: LeadStatus): Promise<void> {
    this._movingLeadId.set(leadId);
    this._error.set(null);

    const previousLeads = this._leads();
    this._leads.set(
      previousLeads.map((lead) =>
        lead.id === leadId ? { ...lead, status } : lead,
      ),
    );

    try {
      await firstValueFrom(this.leadsApi.moveLead(leadId, { status }));
      await this.loadBoard();
    } catch {
      this._leads.set(previousLeads);
      this._error.set('Failed to move lead.');
    } finally {
      this._movingLeadId.set(null);
    }
  }

  async createLead(payload: CreateLeadRequest): Promise<void> {
    this._creating.set(true);
    this._error.set(null);

    try {
      await firstValueFrom(this.leadsApi.createLead(payload));
      await this.loadBoard();
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        const backendMessage = this.extractBackendErrorMessage(error);
        this._error.set(backendMessage ?? 'Failed to create lead.');
      } else {
        this._error.set('Failed to create lead.');
      }
    } finally {
      this._creating.set(false);
    }
  }

  async updateLead(id: number, payload: UpdateLeadRequest): Promise<void> {
    this._error.set(null);

    try {
      await firstValueFrom(this.leadsApi.updateLead(id, payload));
      await this.loadBoard();
      await this.loadLeadDetails(id);
    } catch {
      this._error.set('Failed to update lead.');
    }
  }

  async deleteLead(id: number): Promise<void> {
    this._error.set(null);

    try {
      await firstValueFrom(this.leadsApi.deleteLead(id));
      await this.loadBoard();
    } catch {
      this._error.set('Failed to delete lead.');
    }
  }

  async loadLeadDetails(leadId: number): Promise<void> {
    this._detailsLoading.set(true);

    try {
      const [leadResponse, eventsResponse] = await Promise.all([
        firstValueFrom(this.leadsApi.getLead(leadId)),
        firstValueFrom(this.leadsApi.getLeadEvents(leadId)),
      ]);

      this._selectedLeadDetails.set(leadResponse.item);
      this._selectedLeadEvents.set(this.extractLeadEvents(eventsResponse));
    } catch {
      this._selectedLeadDetails.set(null);
      this._selectedLeadEvents.set([]);
    } finally {
      this._detailsLoading.set(false);
    }
  }

  clearLeadDetails(): void {
    this._selectedLeadDetails.set(null);
    this._selectedLeadEvents.set([]);
  }

  private extractLeads(response: GetLeadsResponse): Lead[] {
    if (response.items) {
      return response.items;
    }

    if (response.leads) {
      return response.leads;
    }

    return [];
  }

  private extractLeadEvents(response: GetLeadEventsResponse): LeadEvent[] {
    if (response.items) {
      return response.items;
    }

    if (response.events) {
      return response.events;
    }

    return [];
  }

  private extractCompletedCount(summary: CompletedSummary): number {
    if (summary.completed_count !== undefined) {
      return summary.completed_count;
    }

    if (summary.total_count !== undefined) {
      return summary.total_count;
    }

    return 0;
  }

  private getNumericSummaryByKeys(keys: string[]): number {
    for (const key of keys) {
      const value = this.summaryValue(key);
      if (typeof value === 'number') {
        return value;
      }
    }

    return 0;
  }

  private extractBackendErrorMessage(error: HttpErrorResponse): string | null {
    const errorBody = error.error;

    if (typeof errorBody === 'string' && errorBody.length > 0) {
      return errorBody;
    }

    if (
      errorBody &&
      typeof errorBody === 'object' &&
      'message' in errorBody &&
      typeof errorBody.message === 'string' &&
      errorBody.message.length > 0
    ) {
      return errorBody.message;
    }

    if (
      errorBody &&
      typeof errorBody === 'object' &&
      'error' in errorBody &&
      typeof errorBody.error === 'string' &&
      errorBody.error.length > 0
    ) {
      return errorBody.error;
    }

    return null;
  }

  private summaryValue(key: string): number | string | undefined {
    const summary = this._summary();

    switch (key) {
      case 'new_count':
        return summary.new_count;
      case 'in_progress_count':
        return summary.in_progress_count;
      case 'paid_count':
        return summary.paid_count;
      case 'completed_count':
        return summary.completed_count;
      case 'paid_week_count':
        return summary.paid_week_count;
      case 'paid_this_week_count':
        return summary.paid_this_week_count;
      case 'week_paid_count':
        return summary.week_paid_count;
      case 'total_amount_minor':
        return summary.total_amount_minor;
      case 'currency_code':
        return summary.currency_code;
      case 'total_count':
        return summary.total_count;
      default:
        return undefined;
    }
  }

  private currentMonthFilters(): { date_from: string; date_to: string } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      date_from: this.toIsoDate(start),
      date_to: this.toIsoDate(now),
    };
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

interface BoardSummary extends LeadsSummary, CompletedSummary {}
