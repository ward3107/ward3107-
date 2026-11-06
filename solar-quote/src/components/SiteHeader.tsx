import Link from 'next/link';
import { asset } from '@/lib/paths';
import { ThemeToggle } from './ThemeToggle';

export function SiteHeader({ current }: { current?: 'editor' | 'quotes' }) {
  return (
    <header className="app-header no-print">
      <div className="shell header-inner">
        <Link className="brand" href="/" aria-label="Solar Quote, דף ראשי">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset('/icon.svg')} width={38} height={38} alt="" />
          <span>
            <strong lang="en" dir="ltr">Solar Quote</strong>
            <small>מחשבון הצעות סולאריות</small>
          </span>
        </Link>
        <nav aria-label="ניווט ראשי">
          <Link href="/" aria-current={current === 'editor' ? 'page' : undefined}>עריכת הצעה</Link>
          <Link href="/quotes" aria-current={current === 'quotes' ? 'page' : undefined}>הצעות שמורות</Link>
          <Link className="nav-demo" href="/proposal?demo=1">הצעה לדוגמה</Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
