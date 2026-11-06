import type { Metadata } from 'next';
import { SavedQuotes } from '@/components/SavedQuotes';

export const metadata: Metadata = { title: 'הצעות שמורות | Solar Quote' };

export default function Page() {
  return <SavedQuotes />;
}
