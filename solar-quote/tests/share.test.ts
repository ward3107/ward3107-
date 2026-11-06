import { describe, expect, it } from 'vitest';
import { createExampleDraft } from '@/lib/defaults';
import { decodeDraft, encodeDraft } from '@/lib/share';
import { isImageDataUrl, sanitizeDraft } from '@/lib/sanitize';
import { addDaysIso, formatIsoDate } from '@/lib/format';

describe('share links', () => {
  it('round-trips a draft, including Hebrew text', () => {
    const draft = createExampleDraft('2026-11-06');
    draft.inputs.panelCount = 40;
    draft.details.customerName = 'משפחת כהן — "בדיקה" 😀';
    const decoded = decodeDraft(encodeDraft(draft));
    expect(decoded).toEqual(draft);
  });

  it('keeps links short by omitting defaults and images', () => {
    const draft = createExampleDraft('2026-11-06');
    draft.details.logo = 'data:image/png;base64,AAAA';
    const encoded = encodeDraft(draft);
    expect(encoded.length).toBeLessThan(1500);
    expect(decodeDraft(encoded)!.details.logo).toBe('');
  });

  it('is url-safe', () => {
    expect(encodeDraft(createExampleDraft('2026-11-06'))).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('rejects garbage', () => {
    expect(decodeDraft('not-valid')).toBeNull();
    expect(decodeDraft('')).toBeNull();
    expect(decodeDraft('e30')).toBeNull(); // {} without version
    expect(decodeDraft('A'.repeat(30_000))).toBeNull();
  });
});

describe('sanitizeDraft', () => {
  it('drops unknown keys, bad numbers and oversized text', () => {
    const draft = sanitizeDraft({
      inputs: { panelCount: 12, panelWatts: 'x', years: Number.POSITIVE_INFINITY, evil: 1 },
      details: { projectName: 'a'.repeat(5000), customerName: 42, __proto__: { polluted: true } },
    })!;
    expect(draft.inputs.panelCount).toBe(12);
    expect(draft.inputs.panelWatts).toBe(670);
    expect(draft.inputs.years).toBe(25);
    expect('evil' in draft.inputs).toBe(false);
    expect(draft.details.projectName).toHaveLength(2000);
    expect(draft.details.customerName).toBe('');
  });

  it('accepts only small image data urls', () => {
    expect(isImageDataUrl('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
    expect(isImageDataUrl('data:image/svg+xml;base64,PHN2Zz4=')).toBe(false);
    expect(isImageDataUrl('javascript:alert(1)')).toBe(false);
    expect(isImageDataUrl(`data:image/png;base64,${'A'.repeat(1_000_000)}`)).toBe(false);
  });

  it('returns null for non-objects', () => {
    expect(sanitizeDraft(null)).toBeNull();
    expect(sanitizeDraft([])).toBeNull();
    expect(sanitizeDraft('x')).toBeNull();
  });
});

describe('dates', () => {
  it('validates real calendar dates only', () => {
    expect(formatIsoDate('2026-11-06')).not.toBe('');
    expect(formatIsoDate('2026-02-30')).toBe('');
    expect(formatIsoDate('hello')).toBe('');
  });
  it('adds days across month boundaries', () => {
    expect(addDaysIso('2026-11-25', 14)).toBe('2026-12-09');
    expect(addDaysIso('2026-12-25', 14)).toBe('2027-01-08');
    expect(addDaysIso('bad', 14)).toBe('');
  });
});
