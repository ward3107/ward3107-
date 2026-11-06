import type { ShareLink } from '@/lib/useShareUrl';
import { buildWhatsAppMessage, whatsappUrl } from '@/lib/whatsapp';

/** Opens WhatsApp with the proposal link. A real link, so it also works with middle click and on iOS. */
export function WhatsAppButton({ link }: { link: ShareLink | null }) {
  const icon = (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20l1.3-4.2A8 8 0 1 1 8.4 18.8L4 20z" />
      <path d="M9.2 8.8c.2 2.6 2.7 5.1 5.5 5.6l1.1-1.1-1.9-1-.8.7c-.9-.4-1.7-1.2-2.1-2.1l.7-.8-1-1.9-1.5 0.6z" />
    </svg>
  );
  if (!link) {
    return (
      <button type="button" className="button button-whatsapp" disabled aria-label="שליחה בוואטסאפ (מכין קישור)">
        {icon}<span>שליחה בוואטסאפ</span>
      </button>
    );
  }
  return (
    <a className="button button-whatsapp" href={whatsappUrl(buildWhatsAppMessage({
      customerName: link.draft.details.customerName,
      projectName: link.draft.details.projectName,
      companyName: link.draft.details.companyName,
      optionCount: 1 + (link.draft.variants?.length ?? 0),
    }, link.url))} target="_blank"
      rel="noopener noreferrer">
      {icon}<span>שליחה בוואטסאפ</span>
    </a>
  );
}
