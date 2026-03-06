import { Injectable, computed, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { CompletedApi } from '../../core/api/completed.api';
import {
  CompletedReason,
  CompletedSort,
  CompletedItem,
  CompletedSummary,
  ExportJob,
} from '../../interfaces/completed.interface';
import {
  buildCompletedFilters,
  buildCompletedListQuery,
  normalizeDateInputToYmd,
} from './archive-query.utils';

@Injectable({ providedIn: 'root' })
export class ArchiveStore {
  private readonly EXPORT_POLL_MS = 4000;

  private readonly _items = signal<CompletedItem[]>([]);
  private readonly _summary = signal<CompletedSummary>({});
  private readonly _exports = signal<ExportJob[]>([]);
  private readonly _loading = signal(false);
  private readonly _exporting = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _exportError = signal<string | null>(null);
  private readonly _downloadingExportId = signal<string | null>(null);

  private readonly _page = signal(1);
  private readonly _pageSize = signal(50);
  private readonly _total = signal(0);
  private readonly _totalPages = signal(0);
  private readonly _sort = signal<CompletedSort>('completed_at_desc');
  private readonly _query = signal('');
  private readonly _reason = signal<CompletedReason | ''>('');
  private readonly _dateFrom = signal('');
  private readonly _dateTo = signal('');
  private exportsPollingTimer: ReturnType<typeof setTimeout> | null = null;

  readonly items = this._items.asReadonly();
  readonly summary = this._summary.asReadonly();
  readonly exports = this._exports.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly exporting = this._exporting.asReadonly();
  readonly error = this._error.asReadonly();
  readonly exportError = this._exportError.asReadonly();
  readonly downloadingExportId = this._downloadingExportId.asReadonly();
  readonly page = this._page.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();
  readonly total = this._total.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();
  readonly sort = this._sort.asReadonly();
  readonly query = this._query.asReadonly();
  readonly reason = this._reason.asReadonly();
  readonly dateFrom = this._dateFrom.asReadonly();
  readonly dateTo = this._dateTo.asReadonly();
  readonly hasItems = computed(() => this._items().length > 0);

  constructor(private readonly completedApi: CompletedApi) {}

  async loadArchive(
    page = this._page(),
    pageSize = this._pageSize(),
  ): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const filters = this.currentFilters();
      const query = buildCompletedListQuery({
        ...this.currentFilterState(),
        sort: this._sort(),
        page,
        pageSize,
      });

      const [completedResponse, summaryResponse] = await Promise.all([
        firstValueFrom(this.completedApi.getCompleted(query)),
        firstValueFrom(this.completedApi.getCompletedSummary(filters)),
      ]);

      this._items.set(completedResponse.items);
      this._page.set(completedResponse.page);
      this._pageSize.set(completedResponse.page_size);
      this._total.set(completedResponse.total);
      this._totalPages.set(completedResponse.total_pages);
      this._summary.set(summaryResponse.summary);
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        this._error.set(
          this.extractArchiveErrorMessage(
            error,
            'Не вдалося завантажити дані архіву.',
          ),
        );
      } else {
        this._error.set('Не вдалося завантажити дані архіву.');
      }
    } finally {
      this._loading.set(false);
    }
  }

  async loadExports(): Promise<void> {
    try {
      const response = await firstValueFrom(this.completedApi.getExports());
      this._exportError.set(null);

      if (response.items) {
        this._exports.set(response.items);
        this.ensureExportsPolling();
        return;
      }

      if (response.jobs) {
        this._exports.set(response.jobs);
        this.ensureExportsPolling();
        return;
      }

      this._exports.set([]);
      this.stopExportsPolling();
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        this._exportError.set(
          this.extractArchiveErrorMessage(
            error,
            'Не вдалося завантажити історію експортів.',
          ),
        );
      } else {
        this._exportError.set('Не вдалося завантажити історію експортів.');
      }
    }
  }

  async createExport(): Promise<void> {
    this._exporting.set(true);
    this._exportError.set(null);

    try {
      await firstValueFrom(
        this.completedApi.createCompletedExport(this.currentFilters()),
      );
      await this.loadExports();
      this.ensureExportsPolling();
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        this._exportError.set(
          this.extractArchiveErrorMessage(
            error,
            'Не вдалося створити експорт.',
          ),
        );
      } else {
        this._exportError.set('Не вдалося створити експорт.');
      }
    } finally {
      this._exporting.set(false);
    }
  }

  setQuery(value: string): void {
    this._query.set(value);
  }

  setReason(value: CompletedReason | ''): void {
    this._reason.set(value);
  }

  setSort(value: CompletedSort): void {
    this._sort.set(value);
  }

  setDateFrom(value: string): void {
    this._dateFrom.set(normalizeDateInputToYmd(value));
  }

  setDateTo(value: string): void {
    this._dateTo.set(normalizeDateInputToYmd(value));
  }

  async applyFilters(): Promise<void> {
    this._page.set(1);
    await this.loadArchive(1, this._pageSize());
  }

  async nextPage(): Promise<void> {
    const page = this._page();
    if (page >= this._totalPages()) {
      return;
    }

    const next = page + 1;
    await this.loadArchive(next, this._pageSize());
  }

  async prevPage(): Promise<void> {
    const page = this._page();
    if (page <= 1) {
      return;
    }

    const prev = page - 1;
    await this.loadArchive(prev, this._pageSize());
  }

  setPageSize(value: number): Promise<void> {
    this._pageSize.set(value);
    this._page.set(1);
    return this.loadArchive(1, value);
  }

  async downloadExport(exportJob: ExportJob): Promise<void> {
    if (exportJob.status !== 'ready') {
      this._exportError.set('Експорт ще готується.');
      return;
    }

    this._downloadingExportId.set(exportJob.id);
    this._exportError.set(null);

    try {
      const result = await firstValueFrom(
        this.completedApi.downloadExport(exportJob.id),
      );
      this.saveBlobToFile(
        result.blob,
        result.fileName ?? exportJob.file_name ?? `export-${exportJob.id}.pdf`,
      );
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        if (this.isExportNotReady(error)) {
          this._exportError.set('Експорт ще готується.');
        } else {
          this._exportError.set(
            this.extractArchiveErrorMessage(
              error,
              'Не вдалося завантажити експорт.',
            ),
          );
        }
      } else {
        this._exportError.set('Не вдалося завантажити експорт.');
      }
    } finally {
      this._downloadingExportId.set(null);
    }
  }

  isExportDownloading(id: string): boolean {
    return this._downloadingExportId() === id;
  }

  currencyCode(): string {
    const value = this._summary().currency_code;
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }

    return 'UAH';
  }

  ensureExportsPolling(): void {
    if (this.hasPendingExports()) {
      this.startExportsPolling();
      return;
    }

    this.stopExportsPolling();
  }

  private currentFilterState(): {
    q: string;
    reason: CompletedReason | '';
    dateFrom: string;
    dateTo: string;
  } {
    return {
      q: this._query(),
      reason: this._reason(),
      dateFrom: this._dateFrom(),
      dateTo: this._dateTo(),
    };
  }

  private currentFilters() {
    return buildCompletedFilters(this.currentFilterState());
  }

  private hasPendingExports(): boolean {
    return this._exports().some(
      (item) => item.status === 'queued' || item.status === 'processing',
    );
  }

  private startExportsPolling(): void {
    if (this.exportsPollingTimer) {
      return;
    }

    this.exportsPollingTimer = setTimeout(() => {
      this.exportsPollingTimer = null;
      void this.pollExports();
    }, this.EXPORT_POLL_MS);
  }

  private stopExportsPolling(): void {
    if (!this.exportsPollingTimer) {
      return;
    }

    clearTimeout(this.exportsPollingTimer);
    this.exportsPollingTimer = null;
  }

  private async pollExports(): Promise<void> {
    await this.loadExports();

    if (this.hasPendingExports()) {
      this.startExportsPolling();
      return;
    }

    this.stopExportsPolling();
  }

  private extractArchiveErrorMessage(
    error: HttpErrorResponse,
    fallback: string,
  ): string {
    const body = error.error;

    if (typeof body === 'string' && body.length > 0) {
      return body;
    }

    if (
      body &&
      typeof body === 'object' &&
      'message' in body &&
      typeof body.message === 'string' &&
      body.message.length > 0
    ) {
      return body.message;
    }

    if (
      body &&
      typeof body === 'object' &&
      'error' in body &&
      typeof body.error === 'string' &&
      body.error.length > 0
    ) {
      return body.error;
    }

    return fallback;
  }

  private isExportNotReady(error: HttpErrorResponse): boolean {
    if (error.status !== 409) {
      return false;
    }

    const body = error.error;

    if (
      body &&
      typeof body === 'object' &&
      'error' in body &&
      body.error === 'export_not_ready'
    ) {
      return true;
    }

    if (
      body &&
      typeof body === 'object' &&
      'message' in body &&
      typeof body.message === 'string' &&
      body.message.toLowerCase().includes('not ready')
    ) {
      return true;
    }

    return false;
  }

  private saveBlobToFile(blob: Blob, fileName: string): void {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(objectUrl);
  }
}
