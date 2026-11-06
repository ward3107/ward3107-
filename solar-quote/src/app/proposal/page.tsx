import type { Metadata } from 'next';
import { ProposalView } from '@/components/ProposalView';

export const metadata: Metadata = {
  title: 'הצעה סולארית | Solar Quote',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ProposalView />;
}
