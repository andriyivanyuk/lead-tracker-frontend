import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

import { CompletedItem } from '../../interfaces/completed.interface';
import { ArchiveStore } from './archive.store';

@Component({
  selector: 'app-archive-page',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTableModule,
  ],
  templateUrl: './archive.page.html',
  styleUrl: './archive.page.scss',
})
export class ArchivePage implements OnInit {
  readonly displayedColumns = [
    'title',
    'contact_name',
    'contact_handle',
    'amount_minor',
    'completed_at',
  ];

  constructor(public readonly archiveStore: ArchiveStore) {}

  ngOnInit(): void {
    this.archiveStore.loadArchive();
  }

  summaryEntries(): Array<{ key: string; value: number }> {
    return Object.entries(this.archiveStore.summary()).map(([key, value]) => ({
      key,
      value,
    }));
  }

  displayAmount(item: CompletedItem): string {
    if (item.amount_minor === null || item.amount_minor === undefined) {
      return '-';
    }

    const currency = item.currency_code ?? 'UAH';
    return `${(item.amount_minor / 100).toFixed(2)} ${currency}`;
  }

  displayCompletedAt(item: CompletedItem): string {
    if (!item.completed_at) {
      return '-';
    }

    return item.completed_at;
  }
}
