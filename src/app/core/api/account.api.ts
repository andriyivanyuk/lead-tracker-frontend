import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { env } from '../../env';
import { AccountResponse } from '../../interfaces/account.interface';

@Injectable({ providedIn: 'root' })
export class AccountApi {
  constructor(private readonly http: HttpClient) {}

  getAccount(): Observable<AccountResponse> {
    return this.http.get<AccountResponse>(`${env.apiBaseUrl}/account`);
  }
}
