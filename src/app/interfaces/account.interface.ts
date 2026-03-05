export interface AccountUser {
  id: number;
  email: string;
  workspace_id: number | null;
}

export interface AccountSubscription {
  id?: number;
  status: string;
  plan?: string | null;
  current_period_end?: string | null;
}

export interface AccountResponse {
  ok: boolean;
  user: AccountUser;
  subscription: AccountSubscription | null;
  is_readonly: boolean;
}
