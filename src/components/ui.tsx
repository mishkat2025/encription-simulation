// Small building blocks shared by the bigger components.

import type { ReactNode } from 'react';
import type { Mode } from '../ciphers/types';

/** The three colour roles: plaintext (blue), ciphertext (orange), key (green). */
export type Tone = 'plain' | 'cipher' | 'key';

// Tailwind only generates classes it can see written out in full,
// so the class names are listed here instead of being built from strings.
export const softTone: Record<Tone, string> = {
  plain: 'bg-plain-soft border-plain',
  cipher: 'bg-cipher-soft border-cipher',
  key: 'bg-key-soft border-key',
};
export const ringTone: Record<Tone, string> = {
  plain: 'ring-plain',
  cipher: 'ring-cipher',
  key: 'ring-key',
};
export const dotTone: Record<Tone, string> = {
  plain: 'bg-plain',
  cipher: 'bg-cipher',
  key: 'bg-key',
};

/** When encrypting, the input is plaintext and the output is ciphertext. Decrypting swaps them. */
export const inputTone = (mode: Mode): Tone => (mode === 'encrypt' ? 'plain' : 'cipher');
export const outputTone = (mode: Mode): Tone => (mode === 'encrypt' ? 'cipher' : 'plain');
export const inputName = (mode: Mode) => (mode === 'encrypt' ? 'Plaintext' : 'Ciphertext');
export const outputName = (mode: Mode) => (mode === 'encrypt' ? 'Ciphertext' : 'Plaintext');

/** Joins class names, skipping any that are false or undefined. */
export const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(' ');

export function Card({ title, action, children }: { title?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-xl border border-line bg-surface p-4 sm:p-5">
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="text-sm font-semibold text-ink">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** A letter (or pair of letters) in a coloured box. */
export function Chip({ tone, children, large }: { tone: Tone; children: ReactNode; large?: boolean }) {
  return (
    <span
      className={cx(
        'inline-flex items-center justify-center rounded-md border font-mono font-semibold text-ink',
        large ? 'h-10 min-w-10 px-2 text-xl' : 'h-7 min-w-7 px-1.5 text-sm',
        softTone[tone],
      )}
    >
      {children}
    </span>
  );
}

/** A coloured dot with a label: shows which colour means what. */
export function LegendDot({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-2">
      <span className={cx('h-2.5 w-2.5 rounded-sm', dotTone[tone])} />
      {children}
    </span>
  );
}

export function Button({
  children,
  onClick,
  disabled,
  label,
  primary,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  /** Read by screen readers and shown as a tooltip. Needed for icon-only buttons. */
  label?: string;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors disabled:opacity-40',
        primary
          ? 'border-accent bg-accent text-on-accent hover:opacity-85'
          : 'border-line-strong bg-surface text-ink hover:bg-sunken',
      )}
    >
      {children}
    </button>
  );
}

/** The top of every topic page: tags, title and a short summary. */
export function PageHeader({ tags, title, aka, summary }: { tags: string[]; title: string; aka?: string; summary: string }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-2">
        {tags.map((tag) => (
          <span key={tag} className="rounded-full border border-line-strong px-2.5 py-0.5">
            {tag}
          </span>
        ))}
      </div>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
      {aka && <p className="mt-1 text-sm text-ink-2">Also called: {aka}</p>}
      <p className="mt-3 max-w-3xl leading-relaxed text-ink-2">{summary}</p>
    </div>
  );
}

export function Tabs<T extends string>({
  tabs,
  current,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  current: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex gap-1 border-b border-line" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={current === tab.id}
          onClick={() => onChange(tab.id)}
          className={cx(
            '-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors',
            current === tab.id ? 'border-accent text-ink' : 'border-transparent text-ink-2 hover:text-ink',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/** A labelled number input. The value stays a string so it can be empty while the user types. */
export function NumberField({
  label,
  value,
  onChange,
  tone = 'key',
  help,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  tone?: Tone;
  help?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink">
        <span className={cx('h-2.5 w-2.5 rounded-sm', dotTone[tone])} />
        {label}
      </span>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-28 rounded-lg border border-line-strong bg-surface px-3 font-mono text-sm text-ink"
      />
      {help && <span className="mt-1.5 block max-w-52 text-xs text-ink-2">{help}</span>}
    </label>
  );
}

/** A small pill button used for presets and examples. */
export function PresetButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-line-strong px-3 py-1 text-left text-xs text-ink transition-colors hover:bg-sunken"
    >
      {children}
    </button>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="mt-3 rounded-lg border border-danger px-3 py-2 text-sm text-ink">
      {children}
    </p>
  );
}
