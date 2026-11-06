import { emptyDetails, exampleInputs } from './defaults';
import type { DetailKey, InputKey, QuoteDetails, QuoteDraft, QuoteInputs } from './types';

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
  return { inputs, details };
}
