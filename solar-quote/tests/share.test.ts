import { describe, expect, it } from 'vitest';
import { createBlankDraft, createExampleDraft, emptyDetails, exampleInputs } from '@/lib/defaults';
import {
  buildShareUrl, decodeCompact, decodeLegacy, decodeShareHash, encodeCompact, encodeLegacy, shareDetailKeys,
  shareInputKeys,
} from '@/lib/share';
import { isImageDataUrl, sanitizeDraft } from '@/lib/sanitize';
import { addDaysIso, formatIsoDate } from '@/lib/format';

describe('share links', () => {
  it('round-trips a draft, including Hebrew text', async () => {
    const draft = createExampleDraft('2026-11-06');
    draft.inputs.panelCount = 40;
    draft.details.customerName = 'משפחת כהן — "בדיקה" 😀';
    expect(await decodeCompact(await encodeCompact(draft))).toEqual(draft);
  });

  it('is much shorter than the legacy format and url-safe', async () => {
    const draft = createExampleDraft('2026-11-06');
    draft.details.logo = 'data:image/png;base64,AAAA';
    const compact = await encodeCompact(draft);
    expect(compact).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(compact.length).toBeLessThan(encodeLegacy(draft).length * 0.6);
    expect((await decodeCompact(compact))!.details.logo).toBe('');
  });

  it('stays tiny when only a few fields changed', async () => {
    const draft = createBlankDraft({}, '2026-11-06');
    draft.inputs.panelCount = 40;
    expect((await encodeCompact(draft)).length).toBeLessThan(80);
  });

  it('still decodes links created with the legacy format', async () => {
    const draft = createExampleDraft('2026-11-06');
    draft.inputs.panelCount = 12;
    expect(decodeLegacy(encodeLegacy(draft))).toEqual(draft);
    expect(await decodeShareHash(`#d=${encodeLegacy(draft)}`)).toEqual(draft);
    expect(await decodeShareHash(`#z=${await encodeCompact(draft)}`)).toEqual(draft);
  });

  it('builds a link in the compact format', async () => {
    const url = await buildShareUrl(createExampleDraft('2026-11-06'), 'https://example.com', '/base');
    expect(url).toMatch(/^https:\/\/example\.com\/base\/proposal#z=[A-Za-z0-9_-]+$/);
  });

  it('keeps the wire format stable (append-only key lists)', () => {
    expect(shareInputKeys.slice(0, 5)).toEqual(['panelCount', 'panelWatts', 'productionHoursPerKwpPerYear', 'pricePerKwpIls', 'discountPercent']);
    expect(shareDetailKeys.slice(0, 3)).toEqual(['projectName', 'customerName', 'customerAddress']);
    // Every model field must be shareable, otherwise a shared link would silently lose it.
    expect([...shareInputKeys].sort()).toEqual(Object.keys(exampleInputs).sort());
    const textKeys = Object.keys(emptyDetails).filter((key) => key !== 'logo' && key !== 'rendering');
    expect([...shareDetailKeys].sort()).toEqual(textKeys.sort());
  });

  it('rejects garbage and out-of-range entries', async () => {
    expect(await decodeShareHash('#z=not-valid')).toBeNull();
    expect(await decodeShareHash('#z=')).toBeNull();
    expect(await decodeShareHash('')).toBeNull();
    expect(await decodeShareHash(`#z=${'A'.repeat(30_000)}`)).toBeNull();
    expect(decodeLegacy('e30')).toBeNull();
    expect(decodeLegacy('A'.repeat(30_000))).toBeNull();
    // Unknown indexes and wrong types are ignored instead of throwing.
    const payload = bytesToB64Url(await deflateText(JSON.stringify([[[999, 1], [0, 'x'], 'bad'], [[999, 'y'], [1, 5]]])));
    const draft = (await decodeCompact(payload))!;
    expect(draft.inputs.panelCount).toBe(exampleInputs.panelCount);
    expect(draft.details.customerName).toBe('');
  });

  it('refuses a decompression bomb', async () => {
    const bomb = bytesToB64Url(await deflateText(JSON.stringify([[], [[0, 'a'.repeat(5_000_000)]]])));
    expect(bomb.length).toBeLessThan(20_000);
    expect(await decodeCompact(bomb)).toBeNull();
  });
});

async function deflateText(text: string): Promise<Uint8Array> {
  const stream = new Blob([new TextEncoder().encode(text)]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

const bytesToB64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

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
