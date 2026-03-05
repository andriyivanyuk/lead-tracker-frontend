import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';

import { AdminInvite } from '../interfaces/admin-invite.interface';
import { AdminInvitesApi } from './admin-invites.api';

@Component({
  selector: 'app-admin-invites-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatToolbarModule,
    MatTableModule,
  ],
  templateUrl: './admin-invites.page.html',
  styleUrl: './admin-invites.page.scss',
})
export class AdminInvitesPage implements OnInit {
  readonly displayedColumns = [
    'code',
    'status',
    'expires_at',
    'used_at',
    'actions',
  ];

  readonly adminKey = signal(localStorage.getItem('lt_admin_key') ?? '');
  readonly hasAdminKey = computed(() => this.adminKey().trim().length > 0);

  readonly adminKeyControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  readonly invites = signal<AdminInvite[]>([]);
  readonly loading = signal(false);
  readonly creating = signal(false);
  readonly error = signal<string | null>(null);

  constructor(private readonly adminInvitesApi: AdminInvitesApi) {}

  ngOnInit(): void {
    if (this.hasAdminKey()) {
      this.reloadInvites();
    }
  }

  saveAdminKey(): void {
    this.adminKeyControl.markAsTouched();

    if (this.adminKeyControl.invalid) {
      return;
    }

    const key = this.adminKeyControl.value.trim();
    localStorage.setItem('lt_admin_key', key);
    this.adminKey.set(key);
    this.error.set(null);
    this.reloadInvites();
  }

  reloadInvites(): void {
    if (!this.hasAdminKey()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.adminInvitesApi.getInvites(50).subscribe({
      next: (response) => {
        this.invites.set(response.invites);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(
          'Failed to load invites. Check admin key and try again.',
        );
        this.loading.set(false);
      },
    });
  }

  createInvite(): void {
    this.creating.set(true);
    this.error.set(null);

    this.adminInvitesApi.createInvite().subscribe({
      next: () => {
        this.creating.set(false);
        this.reloadInvites();
      },
      error: () => {
        this.error.set('Failed to create invite.');
        this.creating.set(false);
      },
    });
  }

  revokeInvite(code: string): void {
    this.error.set(null);

    this.adminInvitesApi.revokeInvite(code).subscribe({
      next: () => this.reloadInvites(),
      error: () => this.error.set('Failed to revoke invite.'),
    });
  }

  canRevoke(invite: AdminInvite): boolean {
    return invite.status === 'new' || !invite.used_at;
  }
}
