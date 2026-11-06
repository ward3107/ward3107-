import { describe, expect, it } from 'vitest';
import { buildWhatsAppMessage, whatsappUrl } from '@/lib/whatsapp';

const link = 'https://ward3107.github.io/ward3107-/solar-quote/proposal#z=AbC_-123';

describe('WhatsApp share', () => {
  it('writes a personal message with the link on its own line', () => {
    const message = buildWhatsAppMessage({ customerName: 'דני כהן', projectName: 'גג בית כהן', companyName: 'סולאר צפון', optionCount: 1 }, link);
    expect(message).toBe(`שלום דני כהן,\nמצורפת הצעת המחיר "גג בית כהן".\n\n${link}\n\nסולאר צפון`);
  });

  it('falls back to a generic message when details are missing', () => {
    const message = buildWhatsAppMessage({ customerName: '  ', projectName: '', companyName: '', optionCount: 1 }, link);
    expect(message).toBe(`שלום,\nמצורפת הצעת המחיר למערכת סולארית.\n\n${link}`);
  });

  it('mentions the number of options only when there are several', () => {
    const base = { customerName: '', projectName: '', companyName: '' };
    expect(buildWhatsAppMessage({ ...base, optionCount: 3 }, link)).toContain('3 חלופות להשוואה');
    expect(buildWhatsAppMessage({ ...base, optionCount: 1 }, link)).not.toContain('חלופות');
  });

  it('builds an encoded wa.me link that round-trips the text', () => {
    const message = buildWhatsAppMessage({ customerName: 'דני', projectName: 'a&b "c"', companyName: '', optionCount: 2 }, link);
    const url = whatsappUrl(message);
    expect(url.startsWith('https://wa.me/?text=')).toBe(true);
    expect(url).not.toMatch(/[\s"&#]/); // nothing that could break out of the query string
    expect(decodeURIComponent(url.slice('https://wa.me/?text='.length))).toBe(message);
  });
});
