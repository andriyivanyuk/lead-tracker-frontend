import { Injectable, computed, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { LeadsApi } from '../../core/api/leads.api';
import {
  CreateLeadRequest,
  Lead,
  GetLeadsResponse,
  LeadStatus,
  UpdateLeadRequest,
} from '../../interfaces/lead.interface';

export const BOARD_STATUSES: LeadStatus[] = [
  'new',
  'in_progress',
  'paid',
  'completed',
];

@Injectable({ providedIn: 'root' })
export class BoardStore {
  private readonly _leads = signal<Lead[]>([]);
  private readonly _summary = signal<Record<string, number>>({});
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _movingLeadId = signal<number | null>(null);
  private readonly _creating = signal(false);

  readonly leads = this._leads.asReadonly();
  readonly summary = this._summary.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly movingLeadId = this._movingLeadId.asReadonly();
  readonly creating = this._creating.asReadonly();
  readonly statuses = computed(() => BOARD_STATUSES);

  constructor(private readonly leadsApi: LeadsApi) {}

  async loadBoard(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const [leadsResponse, summaryResponse] = await Promise.all([
        firstValueFrom(this.leadsApi.getLeads()),
        firstValueFrom(this.leadsApi.getLeadsSummary()),
      ]);

      this._leads.set(this.extractLeads(leadsResponse));
      this._summary.set(summaryResponse.summary);
    } catch {
      this._error.set('Failed to load board data.');
    } finally {
      this._loading.set(false);
    }
  }

  leadsByStatus(status: LeadStatus): Lead[] {
    return this._leads().filter((lead) => lead.status === status);
  }

  summaryCountByStatus(status: LeadStatus): number {
    const key = `${status}_count`;
    return this._summary()[key] ?? this.leadsByStatus(status).length;
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

  private extractLeads(response: GetLeadsResponse): Lead[] {
    if (response.items) {
      return response.items;
    }

    if (response.leads) {
      return response.leads;
    }

    return [];
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
}
