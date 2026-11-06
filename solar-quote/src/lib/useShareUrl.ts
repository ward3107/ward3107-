'use client';

import { useEffect, useState } from 'react';
import { basePath } from './paths';
import { buildShareUrl } from './share';
import type { QuoteDraft } from './types';

export interface ShareLink {
  url: string;
  /** The exact draft the link was built from, so any text written next to it always matches. */
  draft: QuoteDraft;
}

/**
 * The share link of a draft, computed ahead of time (compression is asynchronous). Having it ready
 * lets a plain <a href> open WhatsApp directly, which popup blockers never interfere with.
 */
export function useShareUrl(draft: QuoteDraft | null, enabled = true, delay = 300): ShareLink | null {
  const [link, setLink] = useState<ShareLink | null>(null);
  useEffect(() => {
    if (!draft || !enabled) {
      setLink(null);
      return undefined;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      buildShareUrl(draft, window.location.origin, basePath)
        .then((url) => { if (active) setLink({ url, draft }); })
        .catch(() => { if (active) setLink(null); });
    }, delay);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [draft, enabled, delay]);
  return link;
}
