'use client';

import { useId, useState } from 'react';
import { ImageError, prepareImage } from '@/lib/image';

interface Props {
  label: string;
  hint: string;
  kind: 'logo' | 'rendering';
  value: string;
  onChange: (value: string) => void;
}

export function ImageField({ label, hint, kind, value, onChange }: Props) {
  const id = useId();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handle(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      onChange(await prepareImage(file, kind));
    } catch (problem) {
      setError(problem instanceof ImageError ? problem.message : 'טעינת התמונה נכשלה.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="field image-field">
      <label htmlFor={id}>{label}</label>
      <div className="image-row">
        <div className="image-preview" data-kind={kind}>
          {value
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={value} alt={`תצוגה מקדימה: ${label}`} />
            : <span aria-hidden="true">אין תמונה</span>}
        </div>
        <div className="image-actions">
          <input id={id} type="file" accept="image/png,image/jpeg,image/webp" disabled={busy}
            aria-describedby={`${id}-hint`}
            onChange={(event) => { void handle(event.target.files?.[0]); event.target.value = ''; }} />
          {value ? <button type="button" className="button button-quiet" onClick={() => onChange('')}>הסרת התמונה</button> : null}
        </div>
      </div>
      {busy ? <p className="field-hint" role="status">מעבד את התמונה…</p> : null}
      {error ? <p className="field-error" role="alert">{error}</p> : null}
      <p className="field-hint" id={`${id}-hint`}>{hint}</p>
    </div>
  );
}
