import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { env } from '../../env';
import {
  AuthTokensResponse,
  LoginRequest,
  LogoutRequest,
  LogoutResponse,
  RefreshRequest,
  RegisterRequest,
} from '../../interfaces/auth.interface';
import { SKIP_AUTH } from '../http/http-context';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly publicContext = new HttpContext().set(SKIP_AUTH, true);

  constructor(private readonly http: HttpClient) {}

  login(payload: LoginRequest): Observable<AuthTokensResponse> {
    return this.http.post<AuthTokensResponse>(
      `${env.apiBaseUrl}/auth/login`,
      payload,
      {
        context: this.publicContext,
      },
    );
  }

  register(payload: RegisterRequest): Observable<AuthTokensResponse> {
    return this.http.post<AuthTokensResponse>(
      `${env.apiBaseUrl}/auth/register`,
      payload,
      {
        context: this.publicContext,
      },
    );
  }

  refresh(payload: RefreshRequest): Observable<AuthTokensResponse> {
    return this.http.post<AuthTokensResponse>(
      `${env.apiBaseUrl}/auth/refresh`,
      payload,
      {
        context: this.publicContext,
      },
    );
  }

  logout(payload: LogoutRequest): Observable<LogoutResponse> {
    return this.http.post<LogoutResponse>(
      `${env.apiBaseUrl}/auth/logout`,
      payload,
    );
  }
}
