import { emptyDetails, exampleInputs } from './defaults';
import { imageKeys, sanitizeDraft } from './sanitize';
import type { DetailKey, InputKey, QuoteDraft } from './types';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function toBase64Url(text: string): string {
  let binary = '';
  for (const byte of textEncoder.encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(encoded: string): string {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(encoded.length / 4) * 4, '=');
  const binary = atob(padded);
  return textDecoder.decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

/**
 * Compact, server-less share payload. Only values that differ from the defaults are included,
 * and images are left out because they would make the link far too long.
 */
export function encodeDraft(draft: QuoteDraft): string {
  const inputs: Record<string, number> = {};
  for (const key of Object.keys(exampleInputs) as InputKey[]) {
    if (draft.inputs[key] !== exampleInputs[key]) inputs[key] = draft.inputs[key];
  }
  const details: Record<string, string> = {};
  for (const key of Object.keys(emptyDetails) as DetailKey[]) {
    if ((imageKeys as readonly string[]).includes(key)) continue;
    if (draft.details[key] !== emptyDetails[key]) details[key] = draft.details[key];
  }
  return toBase64Url(JSON.stringify({ v: 2, i: inputs, d: details }));
}

export function decodeDraft(encoded: string): QuoteDraft | null {
  try {
    if (encoded.length > 20_000) return null;
    const parsed: unknown = JSON.parse(fromBase64Url(encoded));
    if (typeof parsed !== 'object' || parsed === null) return null;
    const payload = parsed as { v?: unknown; i?: unknown; d?: unknown };
    if (payload.v !== 2) return null;
    return sanitizeDraft({ inputs: payload.i, details: payload.d });
  } catch {
    return null;
  }
}

export function buildShareUrl(draft: QuoteDraft, origin: string, basePath: string): string {
  return `${origin}${basePath}/proposal#d=${encodeDraft(draft)}`;
}
