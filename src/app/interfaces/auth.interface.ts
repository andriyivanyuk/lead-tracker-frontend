export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  invite_code: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token: string;
}

export interface AuthTokensResponse {
  ok: boolean;
  access_token: string;
  refresh_token: string;
}

export interface LogoutResponse {
  ok: boolean;
}
