import type { QuoteResult, Scenario } from './finance';
import type {
  DetailKey, InputKey, QuoteDetails, QuoteDraft, QuoteInputs, QuoteVariant, VariantDetailKey, VariantInputKey,
} from './types';

export const MAX_OPTIONS = 3;
export const MAX_NAME_LENGTH = 40;

export const variantInputKeys: readonly VariantInputKey[] = [
  'panelCount', 'panelWatts', 'pricePerKwpIls', 'discountPercent', 'annualMaintenanceIls',
  'selfConsumptionPercent', 'inverterReplacementYear', 'inverterReplacementCostIls',
];

export const variantDetailKeys: readonly VariantDetailKey[] = [
  'panelModel', 'inverter', 'storage', 'mounting', 'panelWarranty', 'inverterWarranty', 'installationTime',
];

const isVariantInput = (key: InputKey): key is VariantInputKey => (variantInputKeys as readonly string[]).includes(key);
const isVariantDetail = (key: DetailKey): key is VariantDetailKey => (variantDetailKeys as readonly string[]).includes(key);

const letters = ['א׳', 'ב׳', 'ג׳'];
export const defaultOptionName = (index: number) => `חלופה ${letters[index] ?? index + 1}`;

export interface ResolvedOption {
  index: number;
  name: string;
  recommended: boolean;
  /** Shared values merged with this option's own values. */
  inputs: QuoteInputs;
  details: QuoteDetails;
}

/** A resolved option together with its calculation. */
export interface OptionResult {
  option: ResolvedOption;
  result: QuoteResult;
  scenarios: Scenario[];
}

export const optionCount = (draft: QuoteDraft) => 1 + (draft.variants?.length ?? 0);

export function resolveOptions(draft: QuoteDraft): ResolvedOption[] {
  const recommended = draft.recommended ?? null;
  const options: ResolvedOption[] = [{
    index: 0,
    name: draft.details.optionName.trim() || defaultOptionName(0),
    recommended: recommended === 0 && optionCount(draft) > 1,
    inputs: draft.inputs,
    details: draft.details,
  }];
  (draft.variants ?? []).forEach((variant, offset) => {
    const index = offset + 1;
    options.push({
      index,
      name: variant.name.trim() || defaultOptionName(index),
      recommended: recommended === index,
      inputs: { ...draft.inputs, ...variant.inputs },
      details: { ...draft.details, ...variant.details },
    });
  });
  return options;
}

function pickVariant(inputs: QuoteInputs, details: QuoteDetails, name: string): QuoteVariant {
  const variantInputs = {} as QuoteVariant['inputs'];
  for (const key of variantInputKeys) variantInputs[key] = inputs[key];
  const variantDetails = {} as QuoteVariant['details'];
  for (const key of variantDetailKeys) variantDetails[key] = details[key];
  return { name, inputs: variantInputs, details: variantDetails };
}

/** Adds an option that starts as a copy of `from` (default: the first option). */
export function addOption(draft: QuoteDraft, from = 0): QuoteDraft {
  if (optionCount(draft) >= MAX_OPTIONS) return draft;
  const source = resolveOptions(draft)[from] ?? resolveOptions(draft)[0]!;
  return { ...draft, variants: [...(draft.variants ?? []), pickVariant(source.inputs, source.details, '')] };
}

/** Removes an option; removing the first promotes the next one. Keeps the recommendation pointing at the same option. */
export function removeOption(draft: QuoteDraft, index: number): QuoteDraft {
  const variants = draft.variants ?? [];
  if (optionCount(draft) <= 1 || index < 0 || index > variants.length) return draft;
  let recommended = draft.recommended ?? null;
  if (recommended === index) recommended = null;
  else if (recommended !== null && recommended > index) recommended -= 1;

  if (index === 0) {
    const [next, ...rest] = variants;
    if (!next) return draft;
    return {
      ...draft,
      inputs: { ...draft.inputs, ...next.inputs },
      details: { ...draft.details, ...next.details, optionName: next.name },
      variants: rest,
      recommended: rest.length === 0 ? null : recommended,
    };
  }
  const rest = variants.filter((_, offset) => offset + 1 !== index);
  return { ...draft, variants: rest, recommended: rest.length === 0 ? null : recommended };
}

export function setRecommended(draft: QuoteDraft, index: number | null): QuoteDraft {
  return { ...draft, recommended: index !== null && index < optionCount(draft) ? index : null };
}

export function setOptionName(draft: QuoteDraft, index: number, name: string): QuoteDraft {
  const value = name.slice(0, MAX_NAME_LENGTH);
  if (index === 0) return { ...draft, details: { ...draft.details, optionName: value } };
  return {
    ...draft,
    variants: (draft.variants ?? []).map((variant, offset) => (offset + 1 === index ? { ...variant, name: value } : variant)),
  };
}

/** Writes a numeric input: option-specific fields go to the option, shared fields to the proposal. */
export function setOptionInput(draft: QuoteDraft, index: number, key: InputKey, value: number): QuoteDraft {
  if (index === 0 || !isVariantInput(key)) return { ...draft, inputs: { ...draft.inputs, [key]: value } };
  return {
    ...draft,
    variants: (draft.variants ?? []).map((variant, offset) =>
      offset + 1 === index ? { ...variant, inputs: { ...variant.inputs, [key]: value } } : variant),
  };
}

export function setOptionDetail(draft: QuoteDraft, index: number, key: DetailKey, value: string): QuoteDraft {
  if (index === 0 || !isVariantDetail(key)) return { ...draft, details: { ...draft.details, [key]: value } };
  return {
    ...draft,
    variants: (draft.variants ?? []).map((variant, offset) =>
      offset + 1 === index ? { ...variant, details: { ...variant.details, [key]: value } } : variant),
  };
}

export const isOptionSpecific = (key: InputKey | DetailKey) =>
  isVariantInput(key as InputKey) || isVariantDetail(key as DetailKey);
