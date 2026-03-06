import { Injectable, computed, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { CompletedApi } from '../../core/api/completed.api';
import { CompletedItem } from '../../interfaces/completed.interface';

@Injectable({ providedIn: 'root' })
export class ArchiveStore {
  private readonly _items = signal<CompletedItem[]>([]);
  private readonly _summary = signal<Record<string, number>>({});
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  private readonly _page = signal(1);
  private readonly _pageSize = signal(50);
  private readonly _total = signal(0);
  private readonly _totalPages = signal(0);

  readonly items = this._items.asReadonly();
  readonly summary = this._summary.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly page = this._page.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();
  readonly total = this._total.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();
  readonly hasItems = computed(() => this._items().length > 0);

  constructor(private readonly completedApi: CompletedApi) {}

  async loadArchive(
    page = this._page(),
    pageSize = this._pageSize(),
  ): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const [completedResponse, summaryResponse] = await Promise.all([
        firstValueFrom(this.completedApi.getCompleted(page, pageSize)),
        firstValueFrom(this.completedApi.getCompletedSummary()),
      ]);

      this._items.set(completedResponse.items);
      this._page.set(completedResponse.page);
      this._pageSize.set(completedResponse.page_size);
      this._total.set(completedResponse.total);
      this._totalPages.set(completedResponse.total_pages);
      this._summary.set(summaryResponse.summary);
    } catch {
      this._error.set('Failed to load archive data.');
    } finally {
      this._loading.set(false);
    }
  }
}
