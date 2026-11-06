'use client';

import { useEffect } from 'react';
import { asset } from '@/lib/paths';

export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator) || !window.isSecureContext) return;
    navigator.serviceWorker.register(asset('/sw.js'), { scope: `${asset('/')}` }).catch(() => {
      // Offline caching is an enhancement; the app keeps working without it.
    });
  }, []);
  return null;
}
