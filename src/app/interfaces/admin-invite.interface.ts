export interface AdminInvite {
  code: string;
  status: string;
  expires_at: string | null;
  used_at: string | null;
  created_at: string;
}
