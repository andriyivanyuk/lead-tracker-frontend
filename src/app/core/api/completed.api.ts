import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { env } from '../../env';
import {
  GetCompletedResponse,
  GetCompletedSummaryResponse,
} from '../../interfaces/completed.interface';

@Injectable({ providedIn: 'root' })
export class CompletedApi {
  constructor(private readonly http: HttpClient) {}

  getCompleted(page = 1, pageSize = 50): Observable<GetCompletedResponse> {
    const params = new HttpParams()
      .set('page', page)
      .set('page_size', pageSize);

    return this.http.get<GetCompletedResponse>(`${env.apiBaseUrl}/completed`, {
      params,
    });
  }

  getCompletedSummary(): Observable<GetCompletedSummaryResponse> {
    return this.http.get<GetCompletedSummaryResponse>(
      `${env.apiBaseUrl}/completed/summary`,
    );
  }
}
