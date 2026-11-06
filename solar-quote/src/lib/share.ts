import { emptyDetails, exampleInputs } from './defaults';
import { variantDetailKeys, variantInputKeys } from './options';
import { sanitizeDraft } from './sanitize';
import type { DetailKey, InputKey, QuoteDraft } from './types';

/**
 * Share links carry the whole proposal in the URL hash, so nothing is stored on a server.
 *
 * Format `z` (current): a JSON array `[inputs, details, variants, recommended]`. `inputs` and
 * `details` are `[index, value]` pairs of the values that differ from the defaults. `variants` are
 * the extra options as `[name, inputs, details]`, listing only what differs from the first option.
 * It is compressed with deflate and written as base64url. Links made before options existed have
 * only the first two elements and still decode.
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
  'contactPhone', 'contactEmail', 'optionName',
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

type Pairs<T> = Array<[number, T]>;
type VariantEntry = [string, Pairs<number>, Pairs<string>];

/** Extra options as differences from the first option. */
function variantEntries(draft: QuoteDraft): VariantEntry[] {
  return (draft.variants ?? []).map((variant) => {
    const inputs: Pairs<number> = [];
    for (const key of variantInputKeys) {
      if (variant.inputs[key] !== draft.inputs[key]) inputs.push([shareInputKeys.indexOf(key), variant.inputs[key]]);
    }
    const details: Pairs<string> = [];
    for (const key of variantDetailKeys) {
      if (variant.details[key] !== draft.details[key]) details.push([shareDetailKeys.indexOf(key), variant.details[key]]);
    }
    return [variant.name, inputs, details];
  });
}

/** Compact format (`z`). */
export async function encodeCompact(draft: QuoteDraft): Promise<string> {
  const { inputs, details } = changedValues(draft);
  const payload: unknown[] = [inputs, details];
  if (draft.variants?.length) payload.push(variantEntries(draft), draft.recommended ?? -1);
  return bytesToBase64Url(await deflate(textEncoder.encode(JSON.stringify(payload))));
}

/** Legacy readable format (`d`). */
export function encodeLegacy(draft: QuoteDraft): string {
  const inputs: Record<string, number> = {};
  const details: Record<string, string> = {};
  for (const [index, value] of changedValues(draft).inputs) inputs[shareInputKeys[index]!] = value;
  for (const [index, value] of changedValues(draft).details) details[shareDetailKeys[index]!] = value;
  const payload: Record<string, unknown> = { v: 2, i: inputs, d: details };
  if (draft.variants?.length) {
    payload.x = draft.variants.map((variant, offset) => {
      const base = variantEntries(draft)[offset]!;
      const changedInputs: Record<string, number> = {};
      for (const [index, value] of base[1]) changedInputs[shareInputKeys[index]!] = value;
      const changedDetails: Record<string, string> = {};
      for (const [index, value] of base[2]) changedDetails[shareDetailKeys[index]!] = value;
      return { name: variant.name, inputs: changedInputs, details: changedDetails };
    });
    payload.r = draft.recommended ?? -1;
  }
  return bytesToBase64Url(textEncoder.encode(JSON.stringify(payload)));
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
    const base = sanitizeDraft({ inputs, details });
    if (!base || !Array.isArray(parsed[2])) return base;

    const variants = (parsed[2] as unknown[]).slice(0, 2).map((entry) => {
      const [name, rawInputs, rawDetails] = Array.isArray(entry) ? entry : [];
      const changedInputs: Record<string, unknown> = {};
      const changedDetails: Record<string, unknown> = {};
      for (const pair of Array.isArray(rawInputs) ? rawInputs : []) {
        const key = Array.isArray(pair) && typeof pair[0] === 'number' ? shareInputKeys[pair[0]] : undefined;
        if (key) changedInputs[key] = pair[1];
      }
      for (const pair of Array.isArray(rawDetails) ? rawDetails : []) {
        const key = Array.isArray(pair) && typeof pair[0] === 'number' ? shareDetailKeys[pair[0]] : undefined;
        if (key) changedDetails[key] = pair[1];
      }
      return { name, inputs: changedInputs, details: changedDetails };
    });
    return sanitizeDraft({ inputs: base.inputs, details: base.details, variants, recommended: parsed[3] });
  } catch {
    return null;
  }
}

export function decodeLegacy(encoded: string): QuoteDraft | null {
  try {
    if (encoded.length > MAX_ENCODED_CHARS) return null;
    const parsed: unknown = JSON.parse(textDecoder.decode(base64UrlToBytes(encoded)));
    if (typeof parsed !== 'object' || parsed === null) return null;
    const payload = parsed as { v?: unknown; i?: unknown; d?: unknown; x?: unknown; r?: unknown };
    if (payload.v !== 2) return null;
    const base = sanitizeDraft({ inputs: payload.i, details: payload.d });
    if (!base || !Array.isArray(payload.x)) return base;
    return sanitizeDraft({ inputs: base.inputs, details: base.details, variants: payload.x, recommended: payload.r });
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
