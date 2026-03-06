import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

import {
  CompletedItem,
  CompletedReason,
  CompletedSort,
  ExportJob,
} from '../../interfaces/completed.interface';
import { ArchiveStore } from './archive.store';

@Component({
  selector: 'app-archive-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
  ],
  templateUrl: './archive.page.html',
  styleUrl: './archive.page.scss',
})
export class ArchivePage implements OnInit {
  readonly reasonOptions: Array<{ value: CompletedReason; label: string }> = [
    { value: 'success', label: 'Успіх' },
    { value: 'refused', label: 'Відмова' },
    { value: 'no_response', label: 'Без відповіді' },
    { value: 'other', label: 'Інше' },
  ];

  readonly sortOptions: Array<{ value: CompletedSort; label: string }> = [
    { value: 'completed_at_desc', label: 'Спочатку нові' },
    { value: 'completed_at_asc', label: 'Спочатку старі' },
  ];

  readonly pageSizeOptions = [20, 50, 100];

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
    this.archiveStore.loadExports();
    this.archiveStore.ensureExportsPolling();
  }

  onQueryChange(value: string): void {
    this.archiveStore.setQuery(value);
  }

  onDateFromChange(value: string): void {
    this.archiveStore.setDateFrom(value);
  }

  onDateToChange(value: string): void {
    this.archiveStore.setDateTo(value);
  }

  onReasonChange(value: string): void {
    this.archiveStore.setReason(this.parseReason(value));
  }

  onSortChange(value: string): void {
    this.archiveStore.setSort(this.parseSort(value));
  }

  async onApplyFilters(): Promise<void> {
    await this.archiveStore.applyFilters();
  }

  async onPageSizeChange(value: number): Promise<void> {
    if (!Number.isFinite(value) || value <= 0) {
      return;
    }

    await this.archiveStore.setPageSize(value);
  }

  async onNextPage(): Promise<void> {
    await this.archiveStore.nextPage();
  }

  async onPrevPage(): Promise<void> {
    await this.archiveStore.prevPage();
  }

  async onCreateExport(): Promise<void> {
    await this.archiveStore.createExport();
  }

  async onDownloadExport(item: ExportJob): Promise<void> {
    await this.archiveStore.downloadExport(item);
  }

  summaryEntries(): Array<{ key: string; value: number | string }> {
    const summary = this.archiveStore.summary();

    return [
      { key: 'total_count', value: summary.total_count ?? 0 },
      { key: 'success_count', value: summary.success_count ?? 0 },
      { key: 'refused_count', value: summary.refused_count ?? 0 },
      { key: 'no_response_count', value: summary.no_response_count ?? 0 },
      { key: 'other_count', value: summary.other_count ?? 0 },
      {
        key: 'total_amount_minor',
        value: summary.total_amount_minor ?? 0,
      },
      { key: 'currency_code', value: summary.currency_code ?? 'UAH' },
    ];
  }

  summaryLabel(key: string): string {
    switch (key) {
      case 'total_count':
        return 'Всього';
      case 'success_count':
        return 'Успішно';
      case 'refused_count':
        return 'Відмова';
      case 'no_response_count':
        return 'Без відповіді';
      case 'other_count':
        return 'Інше';
      case 'total_amount_minor':
        return 'Загальна сума';
      case 'currency_code':
        return 'Валюта';
      default:
        return key;
    }
  }

  summaryValue(key: string, value: number | string): string {
    if (key === 'total_amount_minor' && typeof value === 'number') {
      const currency = this.archiveStore.currencyCode();
      const amountMajor = value / 100;
      const amountText = amountMajor.toLocaleString('uk-UA', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });

      if (currency === 'UAH') {
        return `${amountText} грн`;
      }

      return `${amountText} ${currency}`;
    }

    return String(value);
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

    const parsed = new Date(item.completed_at);
    if (Number.isNaN(parsed.getTime())) {
      return item.completed_at;
    }

    return parsed.toLocaleString('uk-UA');
  }

  exportStatusLabel(item: ExportJob): string {
    switch (item.status) {
      case 'queued':
        return 'У черзі';
      case 'ready':
        return 'Готово';
      case 'processing':
        return 'Обробляється';
      case 'failed':
        return 'Помилка';
      default:
        return item.status;
    }
  }

  exportCreatedAt(item: ExportJob): string {
    const parsed = new Date(item.created_at);
    if (Number.isNaN(parsed.getTime())) {
      return item.created_at;
    }

    return parsed.toLocaleString('uk-UA');
  }

  exportFileName(item: ExportJob): string {
    if (item.file_name && item.file_name.trim().length > 0) {
      return item.file_name;
    }

    return '-';
  }

  private parseReason(value: string): CompletedReason | '' {
    if (value === 'success') {
      return 'success';
    }

    if (value === 'refused') {
      return 'refused';
    }

    if (value === 'no_response') {
      return 'no_response';
    }

    if (value === 'other') {
      return 'other';
    }

    return '';
  }

  private parseSort(value: string): CompletedSort {
    if (value === 'completed_at_asc') {
      return 'completed_at_asc';
    }

    return 'completed_at_desc';
  }
}
