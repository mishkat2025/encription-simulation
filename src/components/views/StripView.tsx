// The view for every substitution cipher that works one letter at a time:
// additive, multiplicative, affine, the table cipher, autokey and Vigenère.
//
// It shows three things:
//   1. the calculation for the current letter,
//   2. the plaintext alphabet above the ciphertext alphabet it maps to,
//   3. the whole message as a table that fills in from left to right.

import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import type { Mode, StripTrace } from '../../ciphers/types';
import { ALPHABET, two } from '../../ciphers/util';
import { ArrowRightIcon } from '../Icons';
import { Chip, cx, inputName, inputTone, outputName, outputTone, ringTone, softTone } from '../ui';

const LETTERS = ALPHABET.split('');

interface Props {
  trace: StripTrace;
  /** Number of letters processed so far. */
  step: number;
  mode: Mode;
}

export function StripView({ trace, step, mode }: Props) {
  const current = step > 0 ? trace.steps[step - 1] : undefined;
  // Before the first step, show the mapping the first letter will use.
  const mapping = (current ?? trace.steps[0])?.mapping ?? ALPHABET.toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex min-h-16 flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-lg bg-sunken px-4 py-3">
        {current ? (
          <>
            <Chip tone={inputTone(mode)} large>
              {current.inChar}
            </Chip>
            <span className="text-muted">
              <ArrowRightIcon />
            </span>
            <span className="text-center font-mono text-sm text-ink sm:text-base">{current.calc}</span>
            <span className="text-muted">
              <ArrowRightIcon />
            </span>
            <Chip tone={outputTone(mode)} large>
              {current.outChar}
            </Chip>
          </>
        ) : (
          <p className="text-sm text-ink-2">Press play, or step forward, to follow the message one letter at a time.</p>
        )}
      </div>

      <AlphabetStrips mapping={mapping} active={current?.plainIndex} mode={mode} showNumbers={trace.showNumbers} />
      <MessageTable trace={trace} step={step} mode={mode} />
    </div>
  );
}

/** The plaintext alphabet with the ciphertext alphabet underneath. */
function AlphabetStrips({
  mapping,
  active,
  mode,
  showNumbers,
}: {
  mapping: string;
  active: number | undefined;
  mode: Mode;
  showNumbers: boolean;
}) {
  const cell = 'flex h-7 items-center justify-center rounded border text-sm transition-colors duration-200';
  const idle = 'border-line bg-surface text-ink-2';

  // On a narrow screen the alphabet does not fit, so scroll the active letter into view.
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = scroller.current;
    const activeCell = box?.querySelector<HTMLElement>('[data-active]');
    if (!box || !activeCell) return;
    const offset = activeCell.getBoundingClientRect().left - box.getBoundingClientRect().left;
    box.scrollTo({ left: box.scrollLeft + offset - box.clientWidth / 2, behavior: 'smooth' });
  }, [active]);

  return (
    <div>
      <div ref={scroller} className="scroll-thin overflow-x-auto pb-2">
        <div className="mx-auto grid w-max grid-cols-[5.5rem_repeat(26,1.6rem)] items-center gap-x-0.5 gap-y-1 font-mono">
          {showNumbers && (
            <>
              <span className="pr-2 text-right font-sans text-xs text-muted">value</span>
              {LETTERS.map((_, i) => (
                <span key={i} className="text-center text-[10px] text-muted tabular-nums">
                  {two(i)}
                </span>
              ))}
            </>
          )}

          <span className="pr-2 text-right font-sans text-xs text-ink-2">plaintext</span>
          {LETTERS.map((ch, i) => (
            <span
              key={ch}
              data-active={i === active ? '' : undefined}
              className={cx(cell, i === active ? cx(softTone.plain, 'font-semibold text-ink ring-2', ringTone.plain) : idle)}
            >
              {ch}
            </span>
          ))}

          <span />
          {LETTERS.map((_, i) => (
            <span key={i} className="h-4 text-center text-xs leading-4 text-ink-2">
              {i === active ? (mode === 'encrypt' ? '↓' : '↑') : ''}
            </span>
          ))}

          <span className="pr-2 text-right font-sans text-xs text-ink-2">ciphertext</span>
          {mapping.split('').map((ch, i) => (
            // The key includes the letter, so a cell replays its fade-in whenever the mapping changes.
            <motion.span
              key={`${i}-${ch}`}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={cx(cell, i === active ? cx(softTone.cipher, 'font-semibold text-ink ring-2', ringTone.cipher) : idle)}
            >
              {ch}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** The whole message, one column per letter, filled in as the steps go by. */
function MessageTable({ trace, step, mode }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const currentCell = useRef<HTMLTableCellElement>(null);

  // Keep the current letter in view when the message is wider than the screen.
  useEffect(() => {
    const box = scroller.current;
    const cell = currentCell.current;
    if (!box || !cell) return;
    box.scrollTo({ left: cell.offsetLeft - box.clientWidth / 2 + cell.clientWidth / 2, behavior: 'smooth' });
  }, [step]);

  const done = (i: number) => i < step;
  const columnClass = (i: number) => cx('w-9 min-w-9 px-0 py-1 text-center', i === step - 1 && 'bg-sunken');
  const label = 'sticky left-0 z-10 bg-surface py-1 pr-3 text-right font-sans text-xs font-normal whitespace-nowrap';

  return (
    <div ref={scroller} className="scroll-thin relative overflow-x-auto pb-2">
      <table className="mx-auto border-collapse font-mono text-sm">
        <tbody>
          <tr>
            <th className={cx(label, 'text-ink-2')}>{inputName(mode)}</th>
            {trace.steps.map((s, i) => (
              <td key={i} ref={i === step - 1 ? currentCell : undefined} className={cx(columnClass(i), 'rounded-t-md')}>
                <Chip tone={inputTone(mode)}>{s.inChar}</Chip>
              </td>
            ))}
          </tr>

          {trace.showNumbers && (
            <tr>
              <th className={cx(label, 'text-muted')}>{mode === 'encrypt' ? 'P value' : 'C value'}</th>
              {trace.steps.map((s, i) => (
                <td key={i} className={cx(columnClass(i), 'text-ink-2 tabular-nums')}>
                  {two(s.inNum)}
                </td>
              ))}
            </tr>
          )}

          {trace.keyStream !== 'none' && (
            <tr>
              <th className={cx(label, 'text-ink-2')}>Key stream</th>
              {trace.steps.map((s, i) => (
                <td key={i} className={cx(columnClass(i), 'tabular-nums')}>
                  {trace.keyStream === 'upfront' || done(i) ? (
                    <span className="inline-flex flex-col items-center leading-tight">
                      <Chip tone="key">{s.keyChar ?? two(s.keyNum ?? 0)}</Chip>
                      {/* The autokey's first key is a plain number with no letter, so label it k₁. */}
                      <span className="mt-0.5 text-xs text-ink-2">{s.keyChar ? two(s.keyNum ?? 0) : 'k₁'}</span>
                    </span>
                  ) : (
                    <span className="text-muted">·</span>
                  )}
                </td>
              ))}
            </tr>
          )}

          {trace.showNumbers && (
            <tr>
              <th className={cx(label, 'text-muted')}>{mode === 'encrypt' ? 'C value' : 'P value'}</th>
              {trace.steps.map((s, i) => (
                <td key={i} className={cx(columnClass(i), 'text-ink-2 tabular-nums')}>
                  {done(i) ? two(s.outNum) : <span className="text-muted">·</span>}
                </td>
              ))}
            </tr>
          )}

          <tr>
            <th className={cx(label, 'text-ink-2')}>{outputName(mode)}</th>
            {trace.steps.map((s, i) => (
              <td key={i} className={cx(columnClass(i), 'rounded-b-md')}>
                {done(i) ? (
                  <motion.span
                    className="inline-block"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Chip tone={outputTone(mode)}>{s.outChar}</Chip>
                  </motion.span>
                ) : (
                  <span className="inline-block h-7 text-muted">·</span>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
