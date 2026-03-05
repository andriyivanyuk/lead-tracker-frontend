import { AdminInvite } from './admin-invite.interface';

export interface GetAdminInvitesResponse {
  ok: boolean;
  invites: AdminInvite[];
}

export interface CreateAdminInviteResponse {
  ok: boolean;
  invite: AdminInvite;
}

export interface RevokeAdminInviteResponse {
  ok: boolean;
}
