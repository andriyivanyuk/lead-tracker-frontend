import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  CreateLeadRequest,
  Lead,
  LeadEvent,
  LeadStatus,
} from '../../interfaces/lead.interface';
import { CreateLeadDialogComponent } from './create-lead-dialog.component';
import { BoardStore } from './board.store';

interface BoardColumn {
  status: LeadStatus;
  label: string;
  className: string;
  isArchive?: boolean;
}

@Component({
  selector: 'app-board-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    DragDropModule,
    MatCardModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './board.page.html',
  styleUrl: './board.page.scss',
})
export class BoardPage implements OnInit {
  readonly columns: BoardColumn[] = [
    { status: 'new', label: 'Нові', className: 'is-new' },
    { status: 'in_progress', label: 'В роботі', className: 'is-in-progress' },
    { status: 'paid', label: 'Оплачено', className: 'is-paid' },
    {
      status: 'completed',
      label: 'Завершені',
      className: 'is-completed',
      isArchive: true,
    },
  ];

  readonly detailsStatusControl = new FormControl<LeadStatus>('new', {
    nonNullable: true,
    validators: [Validators.required],
  });

  readonly detailsNoteControl = new FormControl('', {
    nonNullable: true,
  });

  readonly searchControl = new FormControl('', {
    nonNullable: true,
  });

  readonly selectedLeadId = signal<number | null>(null);
  readonly selectedLead = computed(() => {
    const leadId = this.selectedLeadId();
    if (leadId === null) {
      return null;
    }

    const detailed = this.boardStore.selectedLeadDetails();
    if (detailed && detailed.id === leadId) {
      return detailed;
    }

    const lead = this.boardStore.leads().find((item) => item.id === leadId);
    return lead ?? detailed ?? null;
  });

  savingDetails = false;

  constructor(
    public readonly boardStore: BoardStore,
    private readonly dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.boardStore.loadBoard();
  }

  async onDrop(event: CdkDragDrop<Lead[]>, status: LeadStatus): Promise<void> {
    const lead = event.item.data;
    if (!lead || lead.status === status) {
      return;
    }

    await this.boardStore.moveLead(lead.id, status);

    if (this.selectedLeadId() === lead.id) {
      this.detailsStatusControl.setValue(status);
      await this.boardStore.loadLeadDetails(lead.id);
    }
  }

  async openCreateLeadDialog(): Promise<void> {
    const dialogRef = this.dialog.open<
      CreateLeadDialogComponent,
      void,
      CreateLeadRequest | undefined
    >(CreateLeadDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
    });

    const payload = await firstValueFrom(dialogRef.afterClosed());
    if (!payload) {
      return;
    }

    await this.boardStore.createLead(payload);
  }

  displayLeadTitle(lead: Lead): string {
    if (lead.contact_name && lead.contact_name.trim().length > 0) {
      return lead.contact_name;
    }

    if (lead.title && lead.title.trim().length > 0) {
      return lead.title;
    }

    if (lead.contact_handle && lead.contact_handle.trim().length > 0) {
      return lead.contact_handle;
    }

    return `Lead #${lead.id}`;
  }

  summaryCount(status: LeadStatus): number {
    return this.boardStore.summaryCountByStatus(status);
  }

  paidWeekCount(): number {
    return this.boardStore.paidWeekCount();
  }

  totalAmountLabel(): string {
    const amountMajor = this.boardStore.totalAmountMinor() / 100;
    const formatted = amountMajor.toLocaleString('uk-UA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

    const currency = this.boardStore.totalAmountCurrency();
    if (currency === 'UAH') {
      return `${formatted} грн`;
    }

    return `${formatted} ${currency}`;
  }

  async selectLead(lead: Lead): Promise<void> {
    this.selectedLeadId.set(lead.id);
    this.detailsStatusControl.setValue(lead.status);
    this.detailsNoteControl.setValue(lead.notes ?? '');
    await this.boardStore.loadLeadDetails(lead.id);

    const refreshedLead = this.boardStore.selectedLeadDetails();
    if (refreshedLead && refreshedLead.id === lead.id) {
      this.detailsStatusControl.setValue(refreshedLead.status);
      this.detailsNoteControl.setValue(refreshedLead.notes ?? '');
    }
  }

  hasSelectedLead(): boolean {
    return this.selectedLead() !== null;
  }

  selectedLeadTitle(): string {
    const lead = this.selectedLead();
    if (!lead) {
      return '';
    }

    return this.displayLeadTitle(lead);
  }

  selectedLeadStatusLabel(): string {
    const lead = this.selectedLead();
    if (!lead) {
      return '';
    }

    return this.statusLabel(lead.status);
  }

  selectedLeadCompany(): string | null {
    const lead = this.selectedLead();
    return lead ? lead.title : null;
  }

  selectedLeadPhone(): string | null {
    const lead = this.selectedLead();
    return lead ? lead.phone : null;
  }

  selectedLeadHandle(): string | null {
    const lead = this.selectedLead();
    return lead ? lead.contact_handle : null;
  }

  selectedLeadAmountLabel(): string | null {
    const lead = this.selectedLead();
    if (
      !lead ||
      lead.amount_minor === null ||
      lead.amount_minor === undefined
    ) {
      return null;
    }

    const currency = lead.currency_code ?? 'UAH';
    const major = lead.amount_minor / 100;
    const formatted = major.toLocaleString('uk-UA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

    if (currency === 'UAH') {
      return `${formatted} грн`;
    }

    return `${formatted} ${currency}`;
  }

  async saveSelectedLead(): Promise<void> {
    const lead = this.selectedLead();
    if (!lead) {
      return;
    }

    this.detailsStatusControl.markAsTouched();
    if (this.detailsStatusControl.invalid) {
      return;
    }

    this.savingDetails = true;

    const noteValue = this.detailsNoteControl.value.trim();
    await this.boardStore.updateLead(lead.id, {
      status: this.detailsStatusControl.value,
      notes: noteValue.length > 0 ? noteValue : null,
    });

    this.savingDetails = false;
  }

  statusLabel(status: LeadStatus): string {
    const column = this.columns.find((item) => item.status === status);
    return column ? column.label : status;
  }

  selectedLeadEvents(): LeadEvent[] {
    return this.boardStore.selectedLeadEvents();
  }

  eventDateLabel(event: LeadEvent): string {
    const value = event.created_at;
    if (!value) {
      return '—';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleString('uk-UA');
  }

  eventActorLabel(event: LeadEvent): string {
    if (event.actor_name && event.actor_name.trim().length > 0) {
      return event.actor_name;
    }

    if (event.actor_email && event.actor_email.trim().length > 0) {
      return event.actor_email;
    }

    return 'Система';
  }

  eventText(event: LeadEvent): string {
    if (event.message && event.message.trim().length > 0) {
      return event.message;
    }

    if (event.type && event.type.trim().length > 0) {
      return event.type;
    }

    return 'Оновлення ліда';
  }

  filteredLeads(status: LeadStatus): Lead[] {
    if (status === 'completed') {
      return [];
    }

    const query = this.searchControl.value.trim().toLowerCase();
    const leads = this.boardStore.leadsByStatus(status);

    if (query.length === 0) {
      return leads;
    }

    return leads.filter((lead) => {
      const title = this.displayLeadTitle(lead).toLowerCase();
      const company = lead.title ? lead.title.toLowerCase() : '';
      const handle = lead.contact_handle
        ? lead.contact_handle.toLowerCase()
        : '';
      const phone = lead.phone ? lead.phone.toLowerCase() : '';

      return (
        title.includes(query) ||
        company.includes(query) ||
        handle.includes(query) ||
        phone.includes(query)
      );
    });
  }
}
