import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { env } from '../../env';
import {
  CompletedFilters,
  CompletedListQuery,
  CreateCompletedExportResponse,
  ExportDownloadResult,
  GetCompletedResponse,
  GetCompletedSummaryResponse,
  GetExportsResponse,
} from '../../interfaces/completed.interface';

@Injectable({ providedIn: 'root' })
export class CompletedApi {
  constructor(private readonly http: HttpClient) {}

  getCompleted(query: CompletedListQuery): Observable<GetCompletedResponse> {
    const params = this.appendFilters(query, this.appendListParams(query));

    return this.http.get<GetCompletedResponse>(`${env.apiBaseUrl}/completed`, {
      params,
    });
  }

  getCompletedSummary(
    filters?: CompletedFilters,
  ): Observable<GetCompletedSummaryResponse> {
    const params = this.appendFilters(filters, new HttpParams());

    return this.http.get<GetCompletedSummaryResponse>(
      `${env.apiBaseUrl}/completed/summary`,
      {
        params,
      },
    );
  }

  createCompletedExport(
    filters?: CompletedFilters,
  ): Observable<CreateCompletedExportResponse> {
    const payload: CompletedFilters = {};

    if (filters?.date_from) {
      payload.date_from = filters.date_from;
    }

    if (filters?.date_to) {
      payload.date_to = filters.date_to;
    }

    if (filters?.reason) {
      payload.reason = filters.reason;
    }

    if (filters?.q) {
      payload.q = filters.q;
    }

    return this.http.post<CreateCompletedExportResponse>(
      `${env.apiBaseUrl}/completed/export`,
      payload,
    );
  }

  getExports(): Observable<GetExportsResponse> {
    return this.http.get<GetExportsResponse>(`${env.apiBaseUrl}/exports`);
  }

  downloadExport(id: string): Observable<ExportDownloadResult> {
    return this.http
      .get(`${env.apiBaseUrl}/exports/${encodeURIComponent(id)}/download`, {
        observe: 'response',
        responseType: 'blob',
      })
      .pipe(
        map((response) => ({
          blob: response.body ?? new Blob(),
          fileName: this.extractFileName(response),
        })),
      );
  }

  private appendFilters(
    filters: CompletedFilters | CompletedListQuery | undefined,
    params: HttpParams,
  ): HttpParams {
    let next = params;

    if (filters?.q) {
      next = next.set('q', filters.q);
    }

    if (filters?.reason) {
      next = next.set('reason', filters.reason);
    }

    if (filters?.date_from) {
      next = next.set('date_from', filters.date_from);
    }

    if (filters?.date_to) {
      next = next.set('date_to', filters.date_to);
    }

    return next;
  }

  private appendListParams(query: CompletedListQuery): HttpParams {
    let params = new HttpParams();

    if (query.page !== undefined) {
      params = params.set('page', query.page);
    }

    if (query.page_size !== undefined) {
      params = params.set('page_size', query.page_size);
    }

    if (query.sort) {
      params = params.set('sort', query.sort);
    }

    return params;
  }

  private extractFileName(response: HttpResponse<Blob>): string | null {
    const disposition = response.headers.get('content-disposition');
    if (!disposition) {
      return null;
    }

    const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
    if (utf8Match && utf8Match[1]) {
      return decodeURIComponent(utf8Match[1]);
    }

    const plainMatch = /filename="?([^";]+)"?/i.exec(disposition);
    if (plainMatch && plainMatch[1]) {
      return plainMatch[1];
    }

    return null;
  }
}
