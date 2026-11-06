import { emptyDetails, exampleInputs } from './defaults';
import { sanitizeDraft } from './sanitize';
import type { DetailKey, InputKey, QuoteDraft } from './types';

/**
 * Share links carry the whole proposal in the URL hash, so nothing is stored on a server.
 *
 * Format `z` (current): a JSON array `[[inputIndex, value]…, [detailIndex, text]…]` of the values
 * that differ from the defaults, compressed with deflate and written as base64url.
 * Format `d` (legacy): the same data as readable JSON with key names. Still decoded so links that
 * were already sent keep working, and used as a fallback when compression is unavailable.
 *
 * The key lists below define the wire format. They are append-only: never reorder or remove.
 */
export const shareInputKeys: readonly InputKey[] = [
  'panelCount', 'panelWatts', 'productionHoursPerKwpPerYear', 'pricePerKwpIls', 'discountPercent',
  'vatPercent', 'feedInTariffIlsPerKwh', 'years', 'firstYearPanelEfficiencyPercent',
  'yearlyPanelDegradationPoints', 'annualMaintenanceIls', 'selfConsumptionPercent',
  'retailTariffIlsPerKwh', 'feedInEscalationPercent', 'retailEscalationPercent',
  'maintenanceEscalationPercent', 'inverterReplacementYear', 'inverterReplacementCostIls',
  'discountRatePercent', 'gridEmissionKgPerKwh',
];

/** Images are never shared: they would make the link far too long. */
export const shareDetailKeys: readonly DetailKey[] = [
  'projectName', 'customerName', 'customerAddress', 'companyName', 'proposalDate', 'validityDays',
  'panelModel', 'inverter', 'storage', 'mounting', 'panelWarranty', 'inverterWarranty',
  'installationTime', 'scopeIncluded', 'scopeExcluded', 'paymentTerms', 'notes', 'contactName',
  'contactPhone', 'contactEmail',
];

const MAX_ENCODED_CHARS = 20_000;
const MAX_DECOMPRESSED_BYTES = 200_000;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(encoded: string): Uint8Array {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(encoded.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

export const canCompress = () => typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';

async function deflate(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Inflates with a size cap, so a tiny malicious link cannot expand into megabytes. */
async function inflate(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > MAX_DECOMPRESSED_BYTES) {
      await reader.cancel();
      throw new RangeError('Share payload is too large');
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

function changedValues(draft: QuoteDraft) {
  const inputs: Array<[number, number]> = [];
  shareInputKeys.forEach((key, index) => {
    if (draft.inputs[key] !== exampleInputs[key]) inputs.push([index, draft.inputs[key]]);
  });
  const details: Array<[number, string]> = [];
  shareDetailKeys.forEach((key, index) => {
    if (draft.details[key] !== emptyDetails[key]) details.push([index, draft.details[key]]);
  });
  return { inputs, details };
}

/** Compact format (`z`). */
export async function encodeCompact(draft: QuoteDraft): Promise<string> {
  const { inputs, details } = changedValues(draft);
  return bytesToBase64Url(await deflate(textEncoder.encode(JSON.stringify([inputs, details]))));
}

/** Legacy readable format (`d`). */
export function encodeLegacy(draft: QuoteDraft): string {
  const inputs: Record<string, number> = {};
  const details: Record<string, string> = {};
  for (const [index, value] of changedValues(draft).inputs) inputs[shareInputKeys[index]!] = value;
  for (const [index, value] of changedValues(draft).details) details[shareDetailKeys[index]!] = value;
  return bytesToBase64Url(textEncoder.encode(JSON.stringify({ v: 2, i: inputs, d: details })));
}

export async function decodeCompact(encoded: string): Promise<QuoteDraft | null> {
  try {
    if (encoded.length > MAX_ENCODED_CHARS || !canCompress()) return null;
    const parsed: unknown = JSON.parse(textDecoder.decode(await inflate(base64UrlToBytes(encoded))));
    if (!Array.isArray(parsed) || !Array.isArray(parsed[0]) || !Array.isArray(parsed[1])) return null;
    const inputs: Record<string, unknown> = {};
    const details: Record<string, unknown> = {};
    for (const entry of parsed[0] as unknown[]) {
      if (!Array.isArray(entry)) continue;
      const key = typeof entry[0] === 'number' ? shareInputKeys[entry[0]] : undefined;
      if (key) inputs[key] = entry[1];
    }
    for (const entry of parsed[1] as unknown[]) {
      if (!Array.isArray(entry)) continue;
      const key = typeof entry[0] === 'number' ? shareDetailKeys[entry[0]] : undefined;
      if (key) details[key] = entry[1];
    }
    return sanitizeDraft({ inputs, details });
  } catch {
    return null;
  }
}

export function decodeLegacy(encoded: string): QuoteDraft | null {
  try {
    if (encoded.length > MAX_ENCODED_CHARS) return null;
    const parsed: unknown = JSON.parse(textDecoder.decode(base64UrlToBytes(encoded)));
    if (typeof parsed !== 'object' || parsed === null) return null;
    const payload = parsed as { v?: unknown; i?: unknown; d?: unknown };
    if (payload.v !== 2) return null;
    return sanitizeDraft({ inputs: payload.i, details: payload.d });
  } catch {
    return null;
  }
}

/** Reads a share link hash such as `#z=…` or `#d=…`. */
export async function decodeShareHash(hash: string): Promise<QuoteDraft | null> {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const compact = params.get('z');
  if (compact) return decodeCompact(compact);
  const legacy = params.get('d');
  return legacy ? decodeLegacy(legacy) : null;
}

export async function buildShareUrl(draft: QuoteDraft, origin: string, basePath: string): Promise<string> {
  const page = `${origin}${basePath}/proposal`;
  return canCompress() ? `${page}#z=${await encodeCompact(draft)}` : `${page}#d=${encodeLegacy(draft)}`;
}
