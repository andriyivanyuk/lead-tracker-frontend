import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { env } from '../env';
import {
  CreateAdminInviteResponse,
  GetAdminInvitesResponse,
  RevokeAdminInviteResponse,
} from '../interfaces/admin-invites.responses';

@Injectable({ providedIn: 'root' })
export class AdminInvitesApi {
  constructor(private readonly http: HttpClient) {}

  getInvites(limit = 50): Observable<GetAdminInvitesResponse> {
    const params = new HttpParams().set('limit', limit);

    return this.http.get<GetAdminInvitesResponse>(
      `${env.apiBaseUrl}/admin/invites`,
      {
        headers: this.getAdminHeaders(),
        params,
      },
    );
  }

  createInvite(): Observable<CreateAdminInviteResponse> {
    return this.http.post<CreateAdminInviteResponse>(
      `${env.apiBaseUrl}/admin/invites`,
      {},
      {
        headers: this.getAdminHeaders(),
      },
    );
  }

  revokeInvite(code: string): Observable<RevokeAdminInviteResponse> {
    return this.http.delete<RevokeAdminInviteResponse>(
      `${env.apiBaseUrl}/admin/invites/${encodeURIComponent(code)}`,
      {
        headers: this.getAdminHeaders(),
      },
    );
  }

  private getAdminHeaders(): HttpHeaders {
    const adminKey = localStorage.getItem('lt_admin_key') ?? '';
    return new HttpHeaders({ 'x-admin-key': adminKey });
  }
}
