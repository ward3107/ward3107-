import { emptyDetails, exampleInputs } from './defaults';
import { MAX_NAME_LENGTH, MAX_OPTIONS, variantDetailKeys, variantInputKeys } from './options';
import type { DetailKey, InputKey, QuoteDetails, QuoteDraft, QuoteInputs, QuoteVariant } from './types';

export const MAX_TEXT_LENGTH = 2000;
export const MAX_IMAGE_CHARS = 900_000;

const inputKeys = Object.keys(exampleInputs) as InputKey[];
const detailKeys = Object.keys(emptyDetails) as DetailKey[];
export const imageKeys = ['logo', 'rendering'] as const satisfies readonly DetailKey[];

export function isImageDataUrl(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length <= MAX_IMAGE_CHARS &&
    /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)
  );
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Turns untrusted data (localStorage, a share link) into a well-formed draft. Unknown keys are
 * dropped, missing keys take defaults, numbers must be finite, strings are length-limited and
 * images must be small data URLs. Range checks stay in validateInputs so the editor can show them.
 */
export function sanitizeDraft(raw: unknown): QuoteDraft | null {
  if (!isRecord(raw)) return null;
  const rawInputs = isRecord(raw.inputs) ? raw.inputs : {};
  const rawDetails = isRecord(raw.details) ? raw.details : {};

  const inputs = { ...exampleInputs } as QuoteInputs;
  for (const key of inputKeys) {
    const value = rawInputs[key];
    if (typeof value === 'number' && Number.isFinite(value)) inputs[key] = value;
  }

  const details = { ...emptyDetails } as QuoteDetails;
  for (const key of detailKeys) {
    const value = rawDetails[key];
    if ((imageKeys as readonly string[]).includes(key)) {
      if (isImageDataUrl(value)) details[key] = value;
    } else if (typeof value === 'string') {
      details[key] = value.slice(0, MAX_TEXT_LENGTH);
    }
  }

  const draft: QuoteDraft = { inputs, details };
  const rawVariants = Array.isArray(raw.variants) ? (raw.variants as unknown[]).slice(0, MAX_OPTIONS - 1) : [];
  const variants: QuoteVariant[] = [];
  for (const item of rawVariants) {
    if (!isRecord(item)) continue;
    const variantInputs = {} as QuoteVariant['inputs'];
    const source = isRecord(item.inputs) ? item.inputs : {};
    for (const key of variantInputKeys) {
      const value = source[key];
      variantInputs[key] = typeof value === 'number' && Number.isFinite(value) ? value : inputs[key];
    }
    const variantDetails = {} as QuoteVariant['details'];
    const text = isRecord(item.details) ? item.details : {};
    for (const key of variantDetailKeys) {
      const value = text[key];
      variantDetails[key] = typeof value === 'string' ? value.slice(0, MAX_TEXT_LENGTH) : details[key];
    }
    const name = typeof item.name === 'string' ? item.name.slice(0, MAX_NAME_LENGTH) : '';
    variants.push({ name, inputs: variantInputs, details: variantDetails });
  }
  if (variants.length > 0) {
    draft.variants = variants;
    const recommended = raw.recommended;
    draft.recommended = typeof recommended === 'number' && Number.isInteger(recommended) && recommended >= 0 && recommended <= variants.length
      ? recommended : null;
  }
  return draft;
}
