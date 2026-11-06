export interface WhatsAppContext {
  customerName: string;
  projectName: string;
  companyName: string;
  optionCount: number;
}

/** The message that opens in WhatsApp, with the proposal link on its own line. */
export function buildWhatsAppMessage(context: WhatsAppContext, link: string): string {
  const customer = context.customerName.trim();
  const project = context.projectName.trim();
  const company = context.companyName.trim();
  const lines = [
    customer ? `שלום ${customer},` : 'שלום,',
    project ? `מצורפת הצעת המחיר "${project}".` : 'מצורפת הצעת המחיר למערכת סולארית.',
  ];
  if (context.optionCount > 1) lines.push(`ההצעה כוללת ${context.optionCount} חלופות להשוואה.`);
  lines.push('', link);
  if (company) lines.push('', company);
  return lines.join('\n');
}

/** wa.me opens the WhatsApp app on phones and WhatsApp Web on desktop; the user picks the contact. */
export const whatsappUrl = (message: string) => `https://wa.me/?text=${encodeURIComponent(message)}`;
