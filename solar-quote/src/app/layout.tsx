import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';
import { ServiceWorker } from '@/components/ServiceWorker';
import { asset } from '@/lib/paths';
import './globals.css';

const hebrew = localFont({
  src: [
    { path: '../fonts/hebrew-regular.woff', weight: '400', style: 'normal' },
    { path: '../fonts/hebrew-bold.woff', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-hebrew',
});

export const metadata: Metadata = {
  title: 'Solar Quote | מחשבון הצעה סולארית',
  description: 'מחשבון הצעות למערכות סולאריות: תחזית תפוקה, הכנסות, החזר השקעה, NPV ו־IRR, והצעה מקצועית ללקוח להדפסה ולשיתוף.',
  manifest: asset('/manifest.webmanifest'),
  icons: {
    icon: [{ url: asset('/icon.svg'), type: 'image/svg+xml' }],
    apple: asset('/apple-touch-icon.png'),
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f5ef' },
    { media: '(prefers-color-scheme: dark)', color: '#0c1722' },
  ],
};

// Applies the saved theme before first paint to avoid a flash.
const themeScript = `try{var t=localStorage.getItem('solar-quote:theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={hebrew.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a className="skip-link" href="#main">מעבר לתוכן</a>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
