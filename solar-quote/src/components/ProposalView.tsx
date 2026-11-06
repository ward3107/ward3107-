'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createExampleDraft } from '@/lib/defaults';
import { calculateQuote, calculateScenarios } from '@/lib/finance';
import { basePath } from '@/lib/paths';
import { decodeDraft, buildShareUrl } from '@/lib/share';
import { loadDraft, loadQuotes, saveDraft } from '@/lib/storage';
import type { QuoteDraft } from '@/lib/types';
import { validateInputs } from '@/lib/validation';
import { ProposalDocument } from './ProposalDocument';
import { ThemeToggle } from './ThemeToggle';
import { asset } from '@/lib/paths';

interface Source {
  draft: QuoteDraft;
  mode: 'draft' | 'saved' | 'shared' | 'demo';
  id?: string;
}

function resolveSource(): Source {
  const params = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const shared = hash.get('d');
  if (shared) {
    const draft = decodeDraft(shared);
    if (draft) return { draft, mode: 'shared' };
  }
  if (params.get('demo') === '1') return { draft: createExampleDraft(), mode: 'demo' };
  const id = params.get('id');
  const saved = id ? loadQuotes().find((quote) => quote.id === id) : undefined;
  if (saved) return { draft: { inputs: saved.inputs, details: saved.details }, mode: 'saved', id: saved.id };
  const draft = loadDraft();
  return draft ? { draft, mode: 'draft' } : { draft: createExampleDraft(), mode: 'demo' };
}

export function ProposalView() {
  const [source, setSource] = useState<Source | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => { setSource(resolveSource()); }, []);

  const computed = useMemo(() => {
    if (!source || Object.keys(validateInputs(source.draft.inputs)).length > 0) return null;
    return { result: calculateQuote(source.draft.inputs), scenarios: calculateScenarios(source.draft.inputs) };
  }, [source]);

  useEffect(() => {
    if (!source) return;
    const { projectName, companyName } = source.draft.details;
    document.title = `${projectName.trim() || 'הצעה סולארית'} | ${companyName.trim() || 'Solar Quote'}`;
  }, [source]);

  if (!source) return <main id="main" className="shell" aria-busy="true"><p className="muted loading">טוען את ההצעה…</p></main>;

  const editHref = source.mode === 'saved' && source.id ? `/?id=${source.id}` : '/';

  async function copyLink() {
    if (!source) return;
    const url = buildShareUrl(source.draft, window.location.origin, basePath);
    try {
      await navigator.clipboard.writeText(url);
      setMessage('הקישור הועתק. הוא פותח תצוגה לקריאה בלבד, בלי הלוגו וההדמיה.');
    } catch {
      window.prompt('העתיקו את הקישור:', url);
    }
  }

  function importShared() {
    if (!source) return;
    saveDraft(source.draft);
    window.location.assign(`${basePath}/`);
  }

  return (
    <>
      <header className="toolbar no-print">
        <div className="shell toolbar-inner">
          <Link className="brand brand-compact" href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset('/icon.svg')} width={34} height={34} alt="" />
            <strong lang="en" dir="ltr">Solar Quote</strong>
          </Link>
          <nav aria-label="פעולות בהצעה">
            {source.mode === 'shared'
              ? <button type="button" className="button" onClick={importShared}>פתיחת עותק לעריכה</button>
              : <Link className="button" href={editHref}>חזרה לעריכה</Link>}
            <button type="button" className="button" onClick={() => void copyLink()}>העתקת קישור</button>
            <button type="button" className="button button-primary" disabled={!computed} onClick={() => window.print()}>
              הדפסה / שמירה כ־PDF
            </button>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main id="main" className="proposal-main">
        <div className="shell no-print" aria-live="polite">
          {message ? <p className="notice" data-kind="success" role="status">{message}</p> : null}
          {source.mode === 'shared' ? <p className="notice" data-kind="info">זוהי תצוגה של הצעה ששותפה בקישור, לקריאה בלבד.</p> : null}
        </div>
        {computed ? (
          <ProposalDocument draft={source.draft} result={computed.result} scenarios={computed.scenarios}
            sample={source.mode === 'demo'} reference={source.id ? source.id.slice(0, 8).toUpperCase() : undefined} />
        ) : (
          <div className="shell">
            <p className="notice" data-kind="error" role="alert">
              לא ניתן להציג את ההצעה כי חלק מהנתונים אינם תקינים. <Link href={editHref}>חזרה לעריכה</Link>
            </p>
          </div>
        )}
      </main>
    </>
  );
}
