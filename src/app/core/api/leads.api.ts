import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { env } from '../../env';
import {
  CreateLeadRequest,
  DeleteLeadResponse,
  GetLeadsResponse,
  GetLeadsSummaryResponse,
  LeadItemResponse,
  MoveLeadRequest,
  UpdateLeadRequest,
} from '../../interfaces/lead.interface';

@Injectable({ providedIn: 'root' })
export class LeadsApi {
  constructor(private readonly http: HttpClient) {}

  getLeads(status?: string, q?: string): Observable<GetLeadsResponse> {
    let params = new HttpParams();

    if (status) {
      params = params.set('status', status);
    }

    if (q) {
      params = params.set('q', q);
    }

    return this.http.get<GetLeadsResponse>(`${env.apiBaseUrl}/leads`, {
      params,
    });
  }

  getLeadsSummary(): Observable<GetLeadsSummaryResponse> {
    return this.http.get<GetLeadsSummaryResponse>(
      `${env.apiBaseUrl}/leads/summary`,
    );
  }

  createLead(payload: CreateLeadRequest): Observable<LeadItemResponse> {
    return this.http.post<LeadItemResponse>(`${env.apiBaseUrl}/leads`, payload);
  }

  updateLead(
    id: number,
    payload: UpdateLeadRequest,
  ): Observable<LeadItemResponse> {
    return this.http.patch<LeadItemResponse>(
      `${env.apiBaseUrl}/leads/${id}`,
      payload,
    );
  }

  moveLead(id: number, payload: MoveLeadRequest): Observable<LeadItemResponse> {
    return this.http.post<LeadItemResponse>(
      `${env.apiBaseUrl}/leads/${id}/move`,
      payload,
    );
  }

  deleteLead(id: number): Observable<DeleteLeadResponse> {
    return this.http.delete<DeleteLeadResponse>(
      `${env.apiBaseUrl}/leads/${id}`,
    );
  }
}
