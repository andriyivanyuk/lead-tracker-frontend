import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AccountApi } from '../../core/api/account.api';
import { AuthApi } from '../../core/api/auth.api';
import { TokenStorageService } from '../../core/auth/token-storage.service';
import {
  AccountSubscription,
  AccountUser,
} from '../../interfaces/account.interface';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly _accessToken = signal<string | null>(null);
  private readonly _refreshToken = signal<string | null>(null);
  private readonly _user = signal<AccountUser | null>(null);
  private readonly _subscription = signal<AccountSubscription | null>(null);
  private readonly _isReadonly = signal(false);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  private refreshInFlight: Promise<boolean> | null = null;
  private restoreInFlight: Promise<boolean> | null = null;

  readonly accessToken = this._accessToken.asReadonly();
  readonly refreshToken = this._refreshToken.asReadonly();
  readonly user = this._user.asReadonly();
  readonly subscription = this._subscription.asReadonly();
  readonly isReadonly = this._isReadonly.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isAuthenticated = computed(() => this._accessToken() !== null);

  constructor(
    private readonly authApi: AuthApi,
    private readonly accountApi: AccountApi,
    private readonly tokenStorage: TokenStorageService,
    private readonly router: Router,
  ) {
    this._accessToken.set(this.tokenStorage.getAccessToken());
    this._refreshToken.set(this.tokenStorage.getRefreshToken());

    if (this._accessToken() || this._refreshToken()) {
      void this.ensureSessionRestored();
    }
  }

  async ensureSessionRestored(): Promise<boolean> {
    if (this.restoreInFlight) {
      return this.restoreInFlight;
    }

    this.restoreInFlight = this.restoreSession();
    const restored = await this.restoreInFlight;
    this.restoreInFlight = null;
    return restored;
  }

  clearError(): void {
    this._error.set(null);
  }

  async login(email: string, password: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(
        this.authApi.login({ email, password }),
      );
      this.setTokens(response.access_token, response.refresh_token);
      await this.loadAccount();
      await this.router.navigateByUrl('/app');
    } catch {
      this._error.set('Login failed. Check credentials and try again.');
    } finally {
      this._loading.set(false);
    }
  }

  async register(
    email: string,
    password: string,
    inviteCode: string,
  ): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(
        this.authApi.register({
          email,
          password,
          invite_code: inviteCode,
        }),
      );
      this.setTokens(response.access_token, response.refresh_token);
      await this.loadAccount();
      await this.router.navigateByUrl('/app');
    } catch {
      this._error.set('Registration failed. Check invite code and try again.');
    } finally {
      this._loading.set(false);
    }
  }

  async loadAccount(): Promise<void> {
    const account = await firstValueFrom(this.accountApi.getAccount());
    this._user.set(account.user);
    this._subscription.set(account.subscription);
    this._isReadonly.set(account.is_readonly);
  }

  async refreshAccessToken(): Promise<boolean> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    const refreshToken = this._refreshToken();
    if (!refreshToken) {
      return false;
    }

    this.refreshInFlight = this.executeRefresh(refreshToken);
    const result = await this.refreshInFlight;
    this.refreshInFlight = null;
    return result;
  }

  logout(redirect = true): void {
    this.tokenStorage.clearTokens();
    this._accessToken.set(null);
    this._refreshToken.set(null);
    this._user.set(null);
    this._subscription.set(null);
    this._isReadonly.set(false);
    this._error.set(null);

    if (redirect) {
      this.router.navigateByUrl('/login');
    }
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    this.tokenStorage.setTokens(accessToken, refreshToken);
    this._accessToken.set(accessToken);
    this._refreshToken.set(refreshToken);
  }

  private async executeRefresh(refreshToken: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.authApi.refresh({ refresh_token: refreshToken }),
      );
      this.setTokens(response.access_token, response.refresh_token);
      return true;
    } catch {
      return false;
    }
  }

  private async restoreSession(): Promise<boolean> {
    const accessToken = this._accessToken();
    const refreshToken = this._refreshToken();

    if (!accessToken && !refreshToken) {
      return false;
    }

    if (accessToken) {
      try {
        await this.loadAccount();
        return true;
      } catch {}
    }

    if (refreshToken) {
      const refreshed = await this.refreshAccessToken();
      if (!refreshed) {
        this.logout(false);
        return false;
      }

      try {
        await this.loadAccount();
        return true;
      } catch {
        this.logout(false);
        return false;
      }
    }

    this.logout(false);
    return false;
  }
}
