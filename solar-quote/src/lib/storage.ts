import { companyDetailKeys, emptyDetails } from './defaults';
import { sanitizeDraft } from './sanitize';
import type { QuoteDetails, QuoteDraft, SavedQuote } from './types';

const keys = {
  draft: 'solar-quote:v2:draft',
  quotes: 'solar-quote:v2:quotes',
  company: 'solar-quote:v2:company',
} as const;

export type StorageResult = { ok: true } | { ok: false; reason: 'quota' | 'unavailable' };

function read(key: string): unknown {
  try {
    const text = window.localStorage.getItem(key);
    return text === null ? null : JSON.parse(text);
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): StorageResult {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return { ok: true };
  } catch (error) {
    const quota = error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22);
    return { ok: false, reason: quota ? 'quota' : 'unavailable' };
  }
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const loadDraft = (): QuoteDraft | null => sanitizeDraft(read(keys.draft));
export const saveDraft = (draft: QuoteDraft) => write(keys.draft, draft);

export function loadQuotes(): SavedQuote[] {
  const raw = read(keys.quotes);
  if (!Array.isArray(raw)) return [];
  const quotes: SavedQuote[] = [];
  for (const item of raw as unknown[]) {
    const draft = sanitizeDraft(item);
    const meta = item as { id?: unknown; createdAt?: unknown; updatedAt?: unknown };
    if (!draft || typeof meta.id !== 'string') continue;
    const createdAt = typeof meta.createdAt === 'string' ? meta.createdAt : new Date(0).toISOString();
    const updatedAt = typeof meta.updatedAt === 'string' ? meta.updatedAt : createdAt;
    quotes.push({ ...draft, id: meta.id, createdAt, updatedAt });
  }
  return quotes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function upsertQuote(draft: QuoteDraft, id?: string): { result: StorageResult; quote: SavedQuote } {
  const quotes = loadQuotes();
  const now = new Date().toISOString();
  const existing = id ? quotes.find((quote) => quote.id === id) : undefined;
  const quote: SavedQuote = {
    ...draft,
    id: existing?.id ?? newId(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  const next = [quote, ...quotes.filter((item) => item.id !== quote.id)];
  return { result: write(keys.quotes, next), quote };
}

export function deleteQuote(id: string): StorageResult {
  return write(keys.quotes, loadQuotes().filter((quote) => quote.id !== id));
}

export function loadCompany(): Partial<QuoteDetails> {
  const raw = read(keys.company);
  const draft = sanitizeDraft({ details: raw });
  if (!draft) return {};
  const company: Partial<QuoteDetails> = {};
  for (const key of companyDetailKeys) {
    if (draft.details[key] !== emptyDetails[key]) company[key] = draft.details[key];
  }
  return company;
}

export function saveCompany(details: QuoteDetails): StorageResult {
  const company: Partial<QuoteDetails> = {};
  for (const key of companyDetailKeys) company[key] = details[key];
  return write(keys.company, company);
}

/** Backup file format: a plain JSON list of saved quotes. */
export function exportQuotesJson(): string {
  return JSON.stringify({ app: 'solar-quote', version: 2, quotes: loadQuotes() }, null, 2);
}

export function importQuotesJson(text: string): { imported: number; result: StorageResult } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { imported: 0, result: { ok: false, reason: 'unavailable' } };
  }
  const list = Array.isArray(parsed) ? parsed
    : typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as { quotes?: unknown }).quotes)
      ? (parsed as { quotes: unknown[] }).quotes : [];
  const existing = loadQuotes();
  const known = new Set(existing.map((quote) => quote.id));
  const added: SavedQuote[] = [];
  const now = new Date().toISOString();
  for (const item of list as unknown[]) {
    const draft = sanitizeDraft(item);
    if (!draft) continue;
    const meta = item as { id?: unknown; createdAt?: unknown; updatedAt?: unknown };
    const id = typeof meta.id === 'string' && !known.has(meta.id) ? meta.id : newId();
    known.add(id);
    const createdAt = typeof meta.createdAt === 'string' ? meta.createdAt : now;
    added.push({ ...draft, id, createdAt, updatedAt: typeof meta.updatedAt === 'string' ? meta.updatedAt : createdAt });
  }
  if (added.length === 0) return { imported: 0, result: { ok: true } };
  return { imported: added.length, result: write(keys.quotes, [...added, ...existing]) };
}
