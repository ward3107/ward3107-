'use client';

import { useId, useState, type ReactNode } from 'react';

interface BaseProps {
  label: string;
  /** Small label next to the field name, e.g. whether the value is per option or shared. */
  tag?: string;
  hint?: ReactNode;
  error?: string;
}

function Wrapper({ id, label, tag, hint, error, unit, children }: BaseProps & { id: string; unit?: string; children: ReactNode }) {
  return (
    <div className="field" data-invalid={error ? 'true' : undefined}>
      <label htmlFor={id}>{label}{tag ? <span className="tag" data-shared={tag === 'משותף' ? 'true' : undefined}>{tag}</span> : null}</label>
      <div className="control">
        {children}
        {unit ? <span className="unit" aria-hidden="true">{unit}</span> : null}
      </div>
      {error ? <p className="field-error" id={`${id}-error`}>{error}</p> : null}
      {hint ? <p className="field-hint" id={`${id}-hint`}>{hint}</p> : null}
    </div>
  );
}

const describedBy = (id: string, props: BaseProps) =>
  [props.error ? `${id}-error` : '', props.hint ? `${id}-hint` : ''].filter(Boolean).join(' ') || undefined;

interface NumberFieldProps extends BaseProps {
  value: number;
  onChange: (value: number) => void;
  unit?: string;
}

/**
 * Keeps its own text while typing so that partial input such as "0." or an empty field is
 * possible. The owner remounts it (via `key`) when the whole draft is replaced.
 */
export function NumberField(props: NumberFieldProps) {
  const id = useId();
  const [text, setText] = useState(Number.isFinite(props.value) ? String(props.value) : '');
  return (
    <Wrapper id={id} label={props.label} tag={props.tag} hint={props.hint} error={props.error} unit={props.unit}>
      <input id={id} type="text" inputMode="decimal" autoComplete="off" dir="ltr" value={text}
        aria-invalid={props.error ? true : undefined} aria-describedby={describedBy(id, props)}
        onChange={(event) => {
          const next = event.target.value;
          setText(next);
          const trimmed = next.trim().replace(',', '.');
          props.onChange(trimmed === '' ? Number.NaN : Number(trimmed));
        }} />
    </Wrapper>
  );
}

interface TextFieldProps extends BaseProps {
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'date' | 'tel' | 'email';
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
}

export function TextField({ value, onChange, type = 'text', placeholder, autoComplete, maxLength = 200, ...rest }: TextFieldProps) {
  const id = useId();
  const ltr = type === 'tel' || type === 'email' || type === 'date';
  return (
    <Wrapper id={id} label={rest.label} tag={rest.tag} hint={rest.hint} error={rest.error}>
      <input id={id} type={type} value={value} placeholder={placeholder} autoComplete={autoComplete}
        maxLength={maxLength} dir={ltr ? 'ltr' : 'auto'} className={ltr ? 'ltr-input' : undefined}
        aria-describedby={describedBy(id, rest)} onChange={(event) => onChange(event.target.value)} />
    </Wrapper>
  );
}

export function TextAreaField({ value, onChange, rows = 4, placeholder, ...rest }: Omit<TextFieldProps, 'type'> & { rows?: number }) {
  const id = useId();
  return (
    <Wrapper id={id} label={rest.label} tag={rest.tag} hint={rest.hint} error={rest.error}>
      <textarea id={id} value={value} rows={rows} placeholder={placeholder} maxLength={2000} dir="auto"
        aria-describedby={describedBy(id, rest)} onChange={(event) => onChange(event.target.value)} />
    </Wrapper>
  );
}
