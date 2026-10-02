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
          ? 'border-ink bg-ink text-page hover:opacity-85'
          : 'border-line-strong bg-surface text-ink hover:bg-sunken',
      )}
    >
      {children}
    </button>
  );
}
