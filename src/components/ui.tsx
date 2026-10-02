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

export function Card({
  title,
  subtitle,
  action,
  bodyClassName,
  children,
}: {
  title?: string;
  /** One short line under the title. */
  subtitle?: string;
  action?: ReactNode;
  /** Extra classes for the area under the title, for example to lay it out in columns. */
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.08)]">
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-5 py-3.5 sm:px-6">
          <div className="min-w-0">
            {title && <h2 className="m-0 text-[15px] font-semibold tracking-tight text-ink">{title}</h2>}
            {subtitle && <p className="m-0 mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cx('p-5 sm:p-6', bodyClassName)}>{children}</div>
    </section>
  );
}

/** A small heading inside a card. */
export function Label({ children }: { children: ReactNode }) {
  return <h3 className="m-0 mb-2.5 text-[11px] font-semibold tracking-wider text-muted uppercase">{children}</h3>;
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
        'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition-colors disabled:opacity-35',
        primary
          ? 'border-accent bg-accent text-on-accent hover:brightness-110'
          : 'border-line-strong bg-raised text-ink hover:border-muted hover:bg-sunken',
      )}
    >
      {children}
    </button>
  );
}

/** The top of every topic page: where it sits, title, summary and key facts. */
export function PageHeader({
  tags,
  title,
  aka,
  summary,
  stats,
}: {
  /** The area and group, shown as a breadcrumb trail. */
  tags: string[];
  title: string;
  aka?: string;
  summary: string;
  /** Short facts shown as tiles under the summary, for example the running time. */
  stats?: { label: string; value: string }[];
}) {
  return (
    <div className="pb-1">
      <p className="m-0 flex flex-wrap items-center gap-1.5 text-xs font-medium text-muted">
        {tags.map((tag, i) => (
          <span key={tag} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true">/</span>}
            <span className={i === tags.length - 1 ? 'text-accent-ink' : undefined}>{tag}</span>
          </span>
        ))}
      </p>
      <h1 className="mt-2 mb-0 text-3xl font-bold tracking-tight text-ink sm:text-[2.1rem]">{title}</h1>
      {aka && <p className="mt-1.5 mb-0 text-sm text-muted">Also called: {aka}</p>}
      <p className="mt-3 mb-0 max-w-3xl text-[15px] leading-relaxed text-ink-2">{summary}</p>
      {stats && (
        <dl className="m-0 mt-5 flex flex-wrap gap-2.5">
          {stats.map((stat) => (
            <div key={stat.label} className="min-w-28 rounded-xl border border-line bg-surface px-3.5 py-2.5">
              <dt className="text-[11px] font-semibold tracking-wider text-muted uppercase">{stat.label}</dt>
              <dd className="m-0 mt-0.5 font-mono text-[15px] font-semibold text-ink">{stat.value}</dd>
            </div>
          ))}
        </dl>
      )}
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
    <div className="flex gap-6 border-b border-line" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={current === tab.id}
          onClick={() => onChange(tab.id)}
          className={cx(
            '-mb-px border-b-2 py-2.5 text-sm font-semibold transition-colors',
            current === tab.id ? 'border-accent-ink text-ink' : 'border-transparent text-muted hover:text-ink',
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
        className="h-10 w-28 rounded-lg border border-line-strong bg-sunken px-3 font-mono text-sm text-ink"
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
      className="rounded-full border border-line-strong bg-raised px-3 py-1.5 text-left text-xs font-medium text-ink-2 transition-colors hover:border-accent-ink hover:text-ink"
    >
      {children}
    </button>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="mt-3 mb-0 rounded-lg border border-danger/60 bg-danger/10 px-3 py-2 text-sm text-ink">
      {children}
    </p>
  );
}
