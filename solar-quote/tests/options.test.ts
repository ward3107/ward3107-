import { describe, expect, it } from 'vitest';
import { createExampleDraft } from '@/lib/defaults';
import { calculateQuote } from '@/lib/finance';
import {
  addOption, defaultOptionName, optionCount, removeOption, resolveOptions, setOptionDetail, setOptionInput,
  setOptionName, setRecommended,
} from '@/lib/options';
import { sanitizeDraft } from '@/lib/sanitize';
import { decodeCompact, decodeLegacy, decodeShareHash, encodeCompact, encodeLegacy } from '@/lib/share';
import type { QuoteDraft } from '@/lib/types';

function threeOptions(): QuoteDraft {
  let draft = createExampleDraft('2026-11-06');
  draft = setOptionName(draft, 0, 'בסיסי');
  draft = addOption(draft);
  draft = setOptionName(draft, 1, 'מומלץ');
  draft = setOptionInput(draft, 1, 'panelCount', 40);
  draft = setOptionInput(draft, 1, 'selfConsumptionPercent', 40);
  draft = setOptionDetail(draft, 1, 'storage', 'סוללה 10kWh');
  draft = addOption(draft, 1);
  draft = setOptionInput(draft, 2, 'panelCount', 60);
  draft = setRecommended(draft, 1);
  return draft;
}

describe('options', () => {
  it('a proposal without options behaves as before', () => {
    const draft = createExampleDraft('2026-11-06');
    const options = resolveOptions(draft);
    expect(options).toHaveLength(1);
    expect(options[0]!.inputs).toBe(draft.inputs);
    expect(options[0]!.recommended).toBe(false);
    expect(draft.variants).toBeUndefined();
  });

  it('adds options as copies, up to three', () => {
    let draft = createExampleDraft('2026-11-06');
    draft = addOption(draft);
    draft = addOption(draft);
    draft = addOption(draft);
    expect(optionCount(draft)).toBe(3);
    expect(resolveOptions(draft).map((option) => option.name)).toEqual(['חלופה א׳', 'חלופה ב׳', 'חלופה ג׳']);
    expect(resolveOptions(draft)[2]!.inputs).toEqual(draft.inputs);
  });

  it('routes option-specific fields to the option and shared fields to the proposal', () => {
    let draft = addOption(createExampleDraft('2026-11-06'));
    draft = setOptionInput(draft, 1, 'panelCount', 50);
    draft = setOptionInput(draft, 1, 'vatPercent', 17);
    draft = setOptionDetail(draft, 1, 'inverter', 'ממיר X');
    draft = setOptionDetail(draft, 1, 'notes', 'הערה');
    const [first, second] = resolveOptions(draft);
    expect(first!.inputs.panelCount).toBe(29);
    expect(second!.inputs.panelCount).toBe(50);
    expect(first!.inputs.vatPercent).toBe(17); // shared
    expect(second!.inputs.vatPercent).toBe(17);
    expect(first!.details.inverter).not.toBe('ממיר X');
    expect(second!.details.inverter).toBe('ממיר X');
    expect(first!.details.notes).toBe('הערה');
  });

  it('computes each option independently', () => {
    const [a, b, c] = resolveOptions(threeOptions()).map((option) => calculateQuote(option.inputs));
    expect(a!.system.dcKwp).toBeCloseTo(19.43, 2);
    expect(b!.system.dcKwp).toBeCloseTo(26.8, 2);
    expect(c!.system.dcKwp).toBeCloseTo(40.2, 2);
    expect(b!.price.totalIls).toBeGreaterThan(a!.price.totalIls);
    expect(c!.price.totalIls).toBeGreaterThan(b!.price.totalIls);
  });

  it('marks only the recommended option, and only when there are several', () => {
    const draft = threeOptions();
    expect(resolveOptions(draft).map((option) => option.recommended)).toEqual([false, true, false]);
    expect(resolveOptions(setRecommended(createExampleDraft('2026-11-06'), 0))[0]!.recommended).toBe(false);
    expect(setRecommended(draft, 5).recommended).toBeNull();
  });

  it('removing an option keeps the recommendation on the same option', () => {
    const removedFirst = removeOption(threeOptions(), 0);
    expect(resolveOptions(removedFirst).map((option) => option.name)).toEqual(['מומלץ', 'חלופה ב׳']);
    expect(removedFirst.inputs.panelCount).toBe(40); // second option was promoted
    expect(removedFirst.details.storage).toBe('סוללה 10kWh');
    expect(resolveOptions(removedFirst).map((option) => option.recommended)).toEqual([true, false]);

    const removedLast = removeOption(threeOptions(), 2);
    expect(optionCount(removedLast)).toBe(2);
    expect(resolveOptions(removedLast)[1]!.recommended).toBe(true);

    const removedRecommended = removeOption(threeOptions(), 1);
    expect(removedRecommended.recommended).toBeNull();

    const single = removeOption(removeOption(threeOptions(), 2), 1);
    expect(optionCount(single)).toBe(1);
    expect(single.recommended).toBeNull();
    expect(removeOption(single, 0)).toBe(single);
  });

  it('uses default names for blank names', () => {
    const draft = setOptionName(addOption(createExampleDraft('2026-11-06')), 1, '   ');
    expect(resolveOptions(draft)[1]!.name).toBe(defaultOptionName(1));
  });
});

describe('sanitize with options', () => {
  it('keeps valid variants and fills missing values from the first option', () => {
    const draft = sanitizeDraft({
      inputs: { panelCount: 10 },
      variants: [{ name: 'x'.repeat(100), inputs: { panelWatts: 600 }, details: { inverter: 'I' } }, 'bad', null],
      recommended: 1,
    })!;
    expect(draft.variants).toHaveLength(1);
    expect(draft.variants![0]!.inputs.panelCount).toBe(10);
    expect(draft.variants![0]!.inputs.panelWatts).toBe(600);
    expect(draft.variants![0]!.name).toHaveLength(40);
    expect(draft.variants![0]!.details.inverter).toBe('I');
    expect(draft.recommended).toBe(1);
  });

  it('caps options at three and ignores bad recommendations', () => {
    const many = sanitizeDraft({ variants: [{}, {}, {}, {}], recommended: 9 })!;
    expect(many.variants).toHaveLength(2);
    expect(many.recommended).toBeNull();
    expect(sanitizeDraft({ variants: [{}], recommended: 1.5 })!.recommended).toBeNull();
  });

  it('adds no option fields to a plain proposal', () => {
    const plain = sanitizeDraft({ inputs: {}, details: {} })!;
    expect('variants' in plain).toBe(false);
    expect('recommended' in plain).toBe(false);
  });
});

describe('share links with options', () => {
  it('round-trips all options in both formats', async () => {
    const draft = threeOptions();
    expect(await decodeCompact(await encodeCompact(draft))).toEqual(draft);
    expect(decodeLegacy(encodeLegacy(draft))).toEqual(draft);
  });

  it('stays compact: options only carry their differences', async () => {
    const single = createExampleDraft('2026-11-06');
    const triple = threeOptions();
    const extra = (await encodeCompact(triple)).length - (await encodeCompact(single)).length;
    expect(extra).toBeLessThan(160);
  });

  it('still decodes links made before options existed', async () => {
    const plain = createExampleDraft('2026-11-06');
    const decoded = (await decodeCompact(await encodeCompact(plain)))!;
    expect(decoded).toEqual(plain);
    expect(decoded.variants).toBeUndefined();
    expect(await decodeShareHash(`#d=${encodeLegacy(plain)}`)).toEqual(plain);
  });

  it('ignores malformed option entries', async () => {
    const draft = (await decodeCompact(await encodeCompact(threeOptions())))!;
    expect(draft.variants).toHaveLength(2);
  });
});
