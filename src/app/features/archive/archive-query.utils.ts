import {
  CompletedFilters,
  CompletedListQuery,
  CompletedReason,
  CompletedSort,
} from '../../interfaces/completed.interface';

export interface ArchiveFilterState {
  q: string;
  reason: CompletedReason | '';
  dateFrom: string;
  dateTo: string;
}

export interface ArchiveListState extends ArchiveFilterState {
  sort: CompletedSort;
  page: number;
  pageSize: number;
}

export function normalizeDateInputToYmd(value: string): string {
  const input = value.trim();
  if (input.length === 0) {
    return '';
  }

  const ymd = matchYmd(input);
  if (ymd) {
    return ymd;
  }

  const fromDots = matchDmy(input, '.');
  if (fromDots) {
    return fromDots;
  }

  const fromSlashes = matchDmy(input, '/');
  if (fromSlashes) {
    return fromSlashes;
  }

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  const year = parsed.getFullYear();
  const month = `${parsed.getMonth() + 1}`.padStart(2, '0');
  const day = `${parsed.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildCompletedFilters(
  state: ArchiveFilterState,
): CompletedFilters {
  const filters: CompletedFilters = {};
  const query = state.q.trim();
  const dateFrom = normalizeDateInputToYmd(state.dateFrom);
  const dateTo = normalizeDateInputToYmd(state.dateTo);

  if (query.length > 0) {
    filters.q = query;
  }

  if (state.reason !== '') {
    filters.reason = state.reason;
  }

  if (dateFrom.length > 0) {
    filters.date_from = dateFrom;
  }

  if (dateTo.length > 0) {
    filters.date_to = dateTo;
  }

  return filters;
}

export function buildCompletedListQuery(
  state: ArchiveListState,
): CompletedListQuery {
  return {
    ...buildCompletedFilters(state),
    sort: state.sort,
    page: state.page,
    page_size: state.pageSize,
  };
}

function matchYmd(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) {
    return null;
  }

  return `${match[1]}-${match[2]}-${match[3]}`;
}

function matchDmy(value: string, separator: '.' | '/'): string | null {
  const escaped = separator === '.' ? '\\.' : '/';
  const regex = new RegExp(`^(\\d{2})${escaped}(\\d{2})${escaped}(\\d{4})$`);
  const match = regex.exec(value);
  if (!match) {
    return null;
  }

  return `${match[3]}-${match[2]}-${match[1]}`;
}
