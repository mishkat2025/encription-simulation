// Draws the array as a row of bars. Colour shows what the current step is
// doing to each position, and the bars slide when values move.

import { motion } from 'motion/react';
import { cx } from '../components/ui';
import type { ArrayStep } from './types';

const PLOT_HEIGHT = 180;

export type BarState = 'found' | 'moved' | 'compare' | 'sorted' | 'idle';

/** What is happening to one position in this step. The most specific state wins. */
export function barState(step: ArrayStep, position: number): BarState {
  if (step.found === position) return 'found';
  if (step.moved.includes(position)) return 'moved';
  if (step.compare.includes(position)) return 'compare';
  if (step.sorted.includes(position)) return 'sorted';
  return 'idle';
}

// Written out in full so Tailwind can see the class names.
const fillClass: Record<BarState, string> = {
  found: 'bg-done',
  moved: 'bg-swap',
  compare: 'bg-compare',
  sorted: 'bg-done',
  idle: 'bg-bar',
};

/** Whether a position is outside the part of the array being worked on. */
export const isDimmed = (step: ArrayStep, position: number) =>
  !!step.range && (position < step.range[0] || position > step.range[1]) && !step.sorted.includes(position);

export function ArrayBars({ step, max }: { step: ArrayStep; max: number }) {
  const { array, ids } = step;
  // Group the pointer names by position: { 3: ['i', 'min'] }
  const labels: Record<number, string[]> = {};
  for (const [name, position] of Object.entries(step.pointers)) {
    (labels[position] ??= []).push(name);
  }

  return (
    <div className="scroll-thin overflow-x-auto rounded-xl border border-line bg-sunken px-3 pt-4 pb-2 sm:px-5">
      <div className="flex items-end justify-center-safe gap-1.5">
        {array.map((value, position) => {
          const state = barState(step, position);
          const isPivot = step.pivot === position;
          const active = state === 'compare' || state === 'moved' || state === 'found';

          return (
            // layout + a stable key make a bar slide to its new place when the value moves.
            <motion.div
              key={ids[position]}
              layout
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className={cx(
                'flex max-w-12 min-w-7 flex-1 flex-col items-center transition-opacity duration-200 sm:min-w-8',
                isDimmed(step, position) && 'opacity-30',
              )}
            >
              <div className="flex w-full flex-col items-center justify-end" style={{ height: PLOT_HEIGHT + 22 }}>
                <span
                  className={cx(
                    'mb-1 font-mono text-xs tabular-nums transition-colors',
                    active ? 'font-bold text-ink' : 'text-ink-2',
                  )}
                >
                  {value}
                </span>
                <div
                  className={cx(
                    'w-full rounded-t-md transition-colors duration-200',
                    fillClass[state],
                    isPivot && 'outline-2 outline-offset-2 outline-accent-ink',
                  )}
                  style={{ height: Math.max(6, (value / max) * PLOT_HEIGHT) }}
                />
              </div>
              <span className="mt-1.5 w-full border-t border-line-strong pt-1 text-center font-mono text-[10px] text-muted tabular-nums">
                {position}
              </span>
              {/* Pointer names (i, j, low, mid ...) sit under the position they point at. */}
              <span className="flex min-h-10 flex-col items-center gap-0.5 pt-0.5">
                {(isPivot || labels[position]) && <span className="text-[9px] leading-none text-accent-ink">▲</span>}
                {isPivot && <Pointer>pivot</Pointer>}
                {(labels[position] ?? []).map((name) => (
                  <Pointer key={name}>{name}</Pointer>
                ))}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function Pointer({ children }: { children: string }) {
  return (
    <span className="rounded bg-accent-soft px-1 font-mono text-[10px] leading-4 font-semibold whitespace-nowrap text-accent-ink">
      {children}
    </span>
  );
}
