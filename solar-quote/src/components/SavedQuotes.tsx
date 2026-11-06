'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { calculateQuote } from '@/lib/finance';
import { formatDecimal, formatIls, formatYears } from '@/lib/format';
import { deleteQuote, exportQuotesJson, importQuotesJson, loadQuotes, newId, upsertQuote } from '@/lib/storage';
import type { SavedQuote } from '@/lib/types';
import { validateInputs } from '@/lib/validation';
import { asset } from '@/lib/paths';
import { SiteHeader } from './SiteHeader';

const dateTime = new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium', timeStyle: 'short' });

function summarize(quote: SavedQuote) {
  if (Object.keys(validateInputs(quote.inputs)).length > 0) return null;
  const { system, price, summary } = calculateQuote(quote.inputs);
  return { kwp: system.dcKwp, total: price.totalIls, payback: summary.paybackYears };
}

export function SavedQuotes() {
  const [quotes, setQuotes] = useState<SavedQuote[] | null>(null);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => { setQuotes(loadQuotes()); }, []);

  const refresh = () => setQuotes(loadQuotes());

  function duplicate(quote: SavedQuote) {
    const copy = {
      inputs: quote.inputs,
      details: { ...quote.details, projectName: `${quote.details.projectName} (עותק)`.trim() },
      variants: quote.variants,
      recommended: quote.recommended,
    };
    const { result } = upsertQuote(copy, newId());
    setMessage(result.ok ? { kind: 'success', text: 'ההצעה שוכפלה.' } : { kind: 'error', text: 'לא נותר מקום לשמירה בדפדפן.' });
    refresh();
  }

  function remove(quote: SavedQuote) {
    const name = quote.details.projectName || quote.details.customerName || 'ההצעה';
    if (!window.confirm(`למחוק את "${name}"? אי אפשר לבטל את הפעולה.`)) return;
    deleteQuote(quote.id);
    setMessage({ kind: 'success', text: 'ההצעה נמחקה.' });
    refresh();
  }

  function download() {
    const url = URL.createObjectURL(new Blob([exportQuotesJson()], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `solar-quote-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function restore(file: File | undefined) {
    if (!file) return;
    const { imported, result } = importQuotesJson(await file.text());
    if (!result.ok) setMessage({ kind: 'error', text: result.reason === 'quota' ? 'אין מספיק מקום בדפדפן לייבוא.' : 'הקובץ אינו גיבוי תקין.' });
    else if (imported === 0) setMessage({ kind: 'error', text: 'לא נמצאו הצעות בקובץ.' });
    else setMessage({ kind: 'success', text: `יובאו ${imported} הצעות.` });
    refresh();
  }

  return (
    <>
      <SiteHeader current="quotes" />
      <main id="main" className="shell">
        <section className="intro">
          <div>
            <p className="eyebrow">ארכיון</p>
            <h1>הצעות שמורות</h1>
            <p className="lead">ההצעות נשמרות בדפדפן הזה בלבד. כדי לעבור למכשיר אחר או לגבות, ייצאו קובץ גיבוי.</p>
          </div>
          <div className="intro-actions">
            <button type="button" className="button" onClick={download} disabled={!quotes?.length}>ייצוא גיבוי</button>
            <button type="button" className="button" onClick={() => fileInput.current?.click()}>ייבוא מגיבוי</button>
            <input ref={fileInput} type="file" accept="application/json,.json" hidden
              onChange={(event) => { void restore(event.target.files?.[0]); event.target.value = ''; }} />
          </div>
        </section>

        <div aria-live="polite">{message ? <p className="notice" data-kind={message.kind} role={message.kind === 'error' ? 'alert' : 'status'}>{message.text}</p> : null}</div>

        {quotes === null ? <p className="muted loading">טוען…</p> : quotes.length === 0 ? (
          <div className="card empty">
            <h2>עדיין אין הצעות שמורות</h2>
            <p className="muted">צרו הצעה ולחצו על ״שמירה״ כדי שתופיע כאן.</p>
            <a className="button button-primary" href={asset('/')}>יצירת הצעה</a>
          </div>
        ) : (
          <ul className="quote-list">
            {quotes.map((quote) => {
              const info = summarize(quote);
              const title = quote.details.projectName || quote.details.customerName || 'הצעה ללא שם';
              return (
                <li key={quote.id} className="card quote-item">
                  <div className="quote-main">
                    <h2 dir="auto">{title}</h2>
                    <p className="muted" dir="auto">
                      {[quote.details.customerName, quote.details.companyName].filter(Boolean).join(' · ') || 'ללא לקוח'}
                      {quote.variants?.length ? ` · ${quote.variants.length + 1} חלופות` : ''}
                      {' · '}עודכנה {dateTime.format(new Date(quote.updatedAt))}
                    </p>
                  </div>
                  {info ? (
                    <dl className="quote-stats">
                      <div><dt>הספק</dt><dd><bdi>{formatDecimal(info.kwp)} kWp</bdi></dd></div>
                      <div><dt>מחיר</dt><dd>{formatIls(info.total)}</dd></div>
                      <div><dt>החזר</dt><dd>{formatYears(info.payback)}</dd></div>
                    </dl>
                  ) : <p className="muted">נתונים לא תקינים</p>}
                  <div className="quote-actions">
                    <a className="button" href={asset(`/?id=${quote.id}`)}>עריכה</a>
                    <Link className="button" href={`/proposal?id=${quote.id}`}>תצוגה</Link>
                    <button type="button" className="button button-quiet" onClick={() => duplicate(quote)}>שכפול</button>
                    <button type="button" className="button button-danger" onClick={() => remove(quote)}>מחיקה</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
