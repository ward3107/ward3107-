'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { createBlankDraft, createExampleDraft } from '@/lib/defaults';
import { calculateQuote, calculateScenarios } from '@/lib/finance';
import { formatDecimal, formatIls, formatInteger } from '@/lib/format';
import { basePath } from '@/lib/paths';
import { buildShareUrl } from '@/lib/share';
import {
  loadCompany, loadDraft, loadQuotes, saveCompany, saveDraft, upsertQuote,
} from '@/lib/storage';
import type { DetailKey, InputKey, QuoteDraft } from '@/lib/types';
import { getWarnings, validateInputs } from '@/lib/validation';
import { NumberField, TextAreaField, TextField } from './Field';
import { ImageField } from './ImageField';
import { AnnualTable, ChartPanel, KpiGrid, ScenarioTable } from './Results';
import { SiteHeader } from './SiteHeader';

type Tab = 'calc' | 'details' | 'equipment' | 'brand';
type Status = { kind: 'info' | 'success' | 'error'; text: string } | null;

const tabs: Array<{ id: Tab; label: string }> = [
  { id: 'calc', label: 'חישוב' },
  { id: 'details', label: 'פרטי הצעה' },
  { id: 'equipment', label: 'ציוד ותנאים' },
  { id: 'brand', label: 'מיתוג' },
];

interface Loaded {
  draft: QuoteDraft;
  quoteId?: string;
  /** Bumped when the whole draft is replaced, so uncontrolled fields remount. */
  revision: number;
}

export function QuoteEditor() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [tab, setTab] = useState<Tab>('calc');
  const [status, setStatus] = useState<Status>(null);
  const [savedJson, setSavedJson] = useState('');
  const draftRef = useRef<QuoteDraft | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id');
    const saved = id ? loadQuotes().find((quote) => quote.id === id) : undefined;
    const draft = saved ?? loadDraft() ?? createBlankDraft(loadCompany());
    setLoaded({ draft: { inputs: draft.inputs, details: draft.details }, quoteId: saved?.id, revision: 0 });
    setSavedJson(saved ? JSON.stringify({ inputs: saved.inputs, details: saved.details }) : '');
  }, []);

  const draft = loaded?.draft ?? null;
  draftRef.current = draft;

  const flush = useCallback(() => {
    const current = draftRef.current;
    if (current && Object.values(current.inputs).every(Number.isFinite)) saveDraft(current);
  }, []);

  useEffect(() => {
    if (!draft) return undefined;
    const timer = window.setTimeout(flush, 400);
    return () => window.clearTimeout(timer);
  }, [draft, flush]);

  useEffect(() => {
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, [flush]);

  const issues = useMemo(() => (draft ? validateInputs(draft.inputs) : {}), [draft]);
  const valid = draft !== null && Object.keys(issues).length === 0;
  const fresh = useMemo(() => {
    if (!draft || !valid) return null;
    return { result: calculateQuote(draft.inputs), scenarios: calculateScenarios(draft.inputs) };
  }, [draft, valid]);
  const [lastGood, setLastGood] = useState(fresh);
  useEffect(() => { if (fresh) setLastGood(fresh); }, [fresh]);
  const shown = fresh ?? lastGood;
  const warnings = useMemo(() => (draft && valid ? getWarnings(draft.inputs) : []), [draft, valid]);

  const dirty = draft !== null && JSON.stringify(draft) !== savedJson;

  const update = useCallback((change: (draft: QuoteDraft) => QuoteDraft) => {
    setLoaded((current) => (current ? { ...current, draft: change(current.draft) } : current));
  }, []);
  const setInput = (key: InputKey) => (value: number) =>
    update((current) => ({ ...current, inputs: { ...current.inputs, [key]: value } }));
  const setDetail = (key: DetailKey) => (value: string) =>
    update((current) => ({ ...current, details: { ...current.details, [key]: value } }));

  function replaceDraft(next: QuoteDraft, quoteId?: string) {
    setLoaded((current) => ({ draft: next, quoteId, revision: (current?.revision ?? 0) + 1 }));
    setSavedJson(quoteId ? JSON.stringify(next) : '');
    window.history.replaceState(null, '', `${basePath}/`);
  }

  function confirmDiscard() {
    return !dirty || window.confirm('יש שינויים שלא נשמרו בהצעה הנוכחית. להמשיך ולהחליף אותה?');
  }

  function startNew() {
    if (!confirmDiscard()) return;
    replaceDraft(createBlankDraft(loadCompany()));
    setStatus({ kind: 'info', text: 'נפתחה הצעה חדשה עם פרטי העסק האחרונים.' });
  }

  function loadExample() {
    if (!confirmDiscard()) return;
    replaceDraft(createExampleDraft());
    setStatus({ kind: 'info', text: 'נטענו נתוני הדוגמה.' });
  }

  function save() {
    if (!draft) return;
    if (!valid) {
      setStatus({ kind: 'error', text: 'יש לתקן את השדות המסומנים לפני השמירה.' });
      return;
    }
    const { result, quote } = upsertQuote(draft, loaded?.quoteId);
    if (!result.ok) {
      setStatus({
        kind: 'error',
        text: result.reason === 'quota'
          ? 'אזל המקום בדפדפן. מחקו הצעות ישנות או הסירו תמונות, ונסו שוב.'
          : 'הדפדפן לא מאפשר שמירה מקומית (ייתכן שמצב גלישה פרטית פעיל).',
      });
      return;
    }
    saveCompany(draft.details);
    setLoaded((current) => (current ? { ...current, quoteId: quote.id } : current));
    setSavedJson(JSON.stringify(draft));
    setStatus({ kind: 'success', text: 'ההצעה נשמרה בהצעות השמורות.' });
  }

  function openProposal(event: MouseEvent<HTMLAnchorElement>) {
    if (!valid) {
      event.preventDefault();
      setStatus({ kind: 'error', text: 'יש לתקן את השדות המסומנים לפני פתיחת ההצעה.' });
      return;
    }
    flush();
  }

  async function copyLink() {
    if (!draft || !valid) {
      setStatus({ kind: 'error', text: 'יש לתקן את השדות המסומנים לפני יצירת קישור.' });
      return;
    }
    const url = await buildShareUrl(draft, window.location.origin, basePath);
    try {
      await navigator.clipboard.writeText(url);
      setStatus({ kind: 'success', text: 'הקישור הועתק. הוא פותח תצוגה לקריאה בלבד, בלי הלוגו וההדמיה.' });
    } catch {
      window.prompt('העתיקו את הקישור:', url);
    }
  }

  if (!draft) {
    return (
      <>
        <SiteHeader current="editor" />
        <main id="main" className="shell" aria-busy="true"><p className="muted loading">טוען את ההצעה…</p></main>
      </>
    );
  }

  const inputField = (key: InputKey, label: string, extra?: { unit?: string; hint?: string }) => (
    <NumberField key={`${loaded?.revision}-${key}`} label={label} value={draft.inputs[key]}
      onChange={setInput(key)} error={issues[key]} unit={extra?.unit} hint={extra?.hint} />
  );
  const textField = (key: DetailKey, label: string, extra?: { hint?: string; type?: 'text' | 'date' | 'tel' | 'email'; autoComplete?: string }) => (
    <TextField label={label} value={draft.details[key]} onChange={setDetail(key)} {...extra} />
  );
  const areaField = (key: DetailKey, label: string, hint?: string, rows = 4) => (
    <TextAreaField label={label} value={draft.details[key]} onChange={setDetail(key)} hint={hint} rows={rows} />
  );

  return (
    <>
      <SiteHeader current="editor" />
      <main id="main" className="shell">
        <section className="intro">
          <div>
            <p className="eyebrow">תכנון מערכת פוטו־וולטאית</p>
            <h1>הצעה סולארית מדויקת, בלי שבועות של חישובים</h1>
            <p className="lead">מזינים את נתוני המערכת, רואים עלות, תחזית והחזר השקעה בזמן אמת, ומוציאים הצעה מקצועית ללקוח.</p>
          </div>
          <div className="intro-actions">
            <button type="button" className="button" onClick={startNew}>הצעה חדשה</button>
            <button type="button" className="button button-quiet" onClick={loadExample}>טעינת דוגמה</button>
          </div>
        </section>

        <div className="workspace">
          <div className="form-col">
            <div className="tabs" role="tablist" aria-label="חלקי הטופס">
              {tabs.map((item) => (
                <button key={item.id} role="tab" type="button" id={`tab-${item.id}`} aria-selected={tab === item.id}
                  aria-controls={`panel-${item.id}`} onClick={() => setTab(item.id)}>
                  {item.label}
                </button>
              ))}
            </div>

            <div key={loaded?.revision} role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="panel">
              {tab === 'calc' ? (
                <>
                  <fieldset className="card">
                    <legend><span className="step">1</span> המערכת</legend>
                    <div className="grid">
                      {inputField('panelCount', 'מספר פאנלים', { unit: 'יח׳' })}
                      {inputField('panelWatts', 'הספק לפאנל', { unit: 'W' })}
                      {inputField('productionHoursPerKwpPerYear', 'שעות ייצור שקולות בשנה', { unit: 'שעות', hint: 'ייצור שנתי לכל kWp. בישראל מקובל כ־1,500 עד 1,900.' })}
                      {inputField('years', 'תקופת התחזית', { unit: 'שנים' })}
                    </div>
                    {shown ? (
                      <p className="derived">
                        הספק מותקן <strong><bdi>{formatDecimal(shown.result.system.dcKwp)} kWp</bdi></strong>
                        {' · '}ייצור שנתי בסיסי <strong>{formatInteger(shown.result.system.baseProductionKwh)} קוט״ש</strong>
                      </p>
                    ) : null}
                  </fieldset>

                  <fieldset className="card">
                    <legend><span className="step">2</span> תמחור</legend>
                    <div className="grid">
                      {inputField('pricePerKwpIls', 'מחיר לקילוואט פיק', { unit: '₪ / kWp' })}
                      {inputField('discountPercent', 'הנחה', { unit: '%' })}
                      {inputField('vatPercent', 'מע״מ', { unit: '%' })}
                    </div>
                    {shown ? (
                      <p className="derived">
                        לפני מע״מ <strong>{formatIls(shown.result.price.beforeVatIls)}</strong>
                        {' · '}סה״כ כולל מע״מ <strong>{formatIls(shown.result.price.totalIls)}</strong>
                      </p>
                    ) : null}
                  </fieldset>

                  <fieldset className="card">
                    <legend><span className="step">3</span> הכנסות ועלויות</legend>
                    <div className="grid">
                      {inputField('feedInTariffIlsPerKwh', 'תעריף מכירה לרשת', { unit: '₪ / קוט״ש' })}
                      {inputField('annualMaintenanceIls', 'תחזוקה שנתית', { unit: '₪' })}
                      {inputField('selfConsumptionPercent', 'צריכה עצמית', { unit: '%', hint: 'החלק מהייצור שנצרך באתר. 0 = מוכרים הכול לרשת.' })}
                      {inputField('retailTariffIlsPerKwh', 'תעריף חשמל שנחסך', { unit: '₪ / קוט״ש', hint: 'מה שהלקוח משלם היום על קוט״ש. משפיע רק עם צריכה עצמית.' })}
                    </div>
                  </fieldset>

                  <details className="card disclosure">
                    <summary><h2><span className="step">4</span> הנחות מתקדמות</h2><span className="muted">התיישנות, עליית מחירים, ממיר, היוון</span></summary>
                    <div className="grid">
                      {inputField('firstYearPanelEfficiencyPercent', 'נצילות פאנלים בשנה הראשונה', { unit: '%' })}
                      {inputField('yearlyPanelDegradationPoints', 'ירידת נצילות שנתית', { unit: 'נק׳ אחוז' })}
                      {inputField('feedInEscalationPercent', 'שינוי שנתי בתעריף המכירה', { unit: '%' })}
                      {inputField('retailEscalationPercent', 'שינוי שנתי בתעריף הצריכה', { unit: '%' })}
                      {inputField('maintenanceEscalationPercent', 'שינוי שנתי בעלות התחזוקה', { unit: '%' })}
                      {inputField('inverterReplacementYear', 'שנת החלפת ממיר', { hint: '0 אם לא מתוכננת החלפה.', unit: 'שנה' })}
                      {inputField('inverterReplacementCostIls', 'עלות החלפת ממיר', { unit: '₪' })}
                      {inputField('discountRatePercent', 'שיעור היוון (ל־NPV)', { unit: '%' })}
                      {inputField('gridEmissionKgPerKwh', 'מקדם פליטה של הרשת', { unit: 'ק״ג CO₂ / קוט״ש', hint: 'הערכה. מומלץ לעדכן לפי הנתון העדכני של הרשות.' })}
                    </div>
                  </details>
                </>
              ) : null}

              {tab === 'details' ? (
                <fieldset className="card">
                  <legend>פרטי ההצעה</legend>
                  <div className="grid">
                    {textField('projectName', 'שם הפרויקט')}
                    {textField('customerName', 'שם הלקוח', { autoComplete: 'off' })}
                    {textField('customerAddress', 'כתובת האתר')}
                    {textField('proposalDate', 'תאריך ההצעה', { type: 'date' })}
                    {textField('validityDays', 'תוקף ההצעה (ימים)', { hint: 'ריק = ללא תוקף מוצג.' })}
                  </div>
                  <h3 className="subhead">פרטי העסק <span className="muted">נשמרים ומתמלאים אוטומטית בהצעה הבאה</span></h3>
                  <div className="grid">
                    {textField('companyName', 'שם העסק')}
                    {textField('contactName', 'איש קשר')}
                    {textField('contactPhone', 'טלפון', { type: 'tel', autoComplete: 'tel' })}
                    {textField('contactEmail', 'אימייל', { type: 'email', autoComplete: 'email' })}
                  </div>
                  {areaField('notes', 'הערות להצעה', undefined, 3)}
                </fieldset>
              ) : null}

              {tab === 'equipment' ? (
                <>
                  <fieldset className="card">
                    <legend>מפרט טכני</legend>
                    <div className="grid">
                      {textField('panelModel', 'דגם פאנל')}
                      {textField('inverter', 'ממיר')}
                      {textField('storage', 'אגירה')}
                      {textField('mounting', 'קונסטרוקציה')}
                      {textField('panelWarranty', 'אחריות פאנלים')}
                      {textField('inverterWarranty', 'אחריות ממיר')}
                      {textField('installationTime', 'זמן התקנה משוער')}
                    </div>
                  </fieldset>
                  <fieldset className="card">
                    <legend>היקף ותנאים</legend>
                    <div className="grid grid-wide">
                      {areaField('scopeIncluded', 'מה כלול', 'שורה לכל פריט.', 5)}
                      {areaField('scopeExcluded', 'מה מחוץ להצעה', 'שורה לכל פריט.', 5)}
                      {areaField('paymentTerms', 'תנאי תשלום', 'שורה לכל אבן דרך.', 5)}
                    </div>
                  </fieldset>
                </>
              ) : null}

              {tab === 'brand' ? (
                <fieldset className="card">
                  <legend>מיתוג ותמונות</legend>
                  <div className="grid grid-wide">
                    <ImageField label="לוגו העסק" kind="logo" value={draft.details.logo} onChange={setDetail('logo')}
                      hint="PNG, JPEG או WebP. התמונה מכווצת אוטומטית ונשמרת רק בדפדפן שלכם." />
                    <ImageField label="הדמיית המערכת" kind="rendering" value={draft.details.rendering} onChange={setDetail('rendering')}
                      hint="הדמיה או תמונת גג שתופיע בהצעה." />
                  </div>
                </fieldset>
              ) : null}
            </div>
          </div>

          <aside className="result-col" aria-label="תוצאות" data-stale={!valid ? 'true' : undefined}>
            <div className="actions card" role="group" aria-label="פעולות">
              <Link className="button button-primary" href="/proposal" onClick={openProposal} aria-disabled={!valid}>
                פתיחת ההצעה ללקוח
              </Link>
              <button type="button" className="button" onClick={save}>שמירה</button>
              <button type="button" className="button" onClick={() => void copyLink()}>העתקת קישור</button>
              <p className="muted autosave">{dirty ? 'נשמר אוטומטית כטיוטה' : 'כל השינויים נשמרו'}</p>
            </div>

            <div aria-live="polite" className="status-region">
              {status ? <p className="notice" data-kind={status.kind} role={status.kind === 'error' ? 'alert' : 'status'}>{status.text}</p> : null}
              {!valid ? <p className="notice" data-kind="error" role="alert">יש להשלים ערכים תקינים בשדות המסומנים. מוצג החישוב התקין האחרון.</p> : null}
              {warnings.map((warning) => <p key={warning} className="notice" data-kind="warn">{warning}</p>)}
            </div>

            {shown ? (
              <>
                <KpiGrid result={shown.result} />
                <ChartPanel result={shown.result} />
                <ScenarioTable scenarios={shown.scenarios} />
                <AnnualTable result={shown.result} />
              </>
            ) : <p className="muted">יש להשלים נתונים תקינים כדי להציג תוצאות.</p>}
          </aside>
        </div>
      </main>

      {shown ? (
        <div className="mobile-bar no-print">
          <div><small>סה״כ כולל מע״מ</small><strong>{formatIls(shown.result.price.totalIls)}</strong></div>
          <Link className="button button-primary" href="/proposal" onClick={openProposal}>פתיחת ההצעה</Link>
        </div>
      ) : null}
    </>
  );
}
