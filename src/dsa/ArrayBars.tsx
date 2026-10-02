// Draws the array as a row of bars. Colour shows what the current step is
// doing to each position, and the bars slide when values move.

import { motion } from 'motion/react';
import { cx } from '../components/ui';
import type { ArrayStep } from './types';

const PLOT_HEIGHT = 170;

export function ArrayBars({ step, max }: { step: ArrayStep; max: number }) {
  const { array, ids } = step;
  // Group the pointer names by position: { 3: ['i', 'min'] }
  const labels: Record<number, string[]> = {};
  for (const [name, position] of Object.entries(step.pointers)) {
    (labels[position] ??= []).push(name);
  }

  return (
    <div className="scroll-thin overflow-x-auto pb-1">
      <div className="mx-auto flex w-max items-end gap-1.5" style={{ minHeight: PLOT_HEIGHT + 64 }}>
        {array.map((value, position) => {
          const inRange = !step.range || (position >= step.range[0] && position <= step.range[1]);
          const isFound = step.found === position;
          const isSorted = step.sorted.includes(position);
          const isMoved = step.moved.includes(position);
          const isCompared = step.compare.includes(position);
          const isPivot = step.pivot === position;

          // The most specific state wins.
          const fill = isFound
            ? 'bg-key'
            : isMoved
              ? 'bg-cipher'
              : isCompared
                ? 'bg-plain'
                : isSorted
                  ? 'bg-key'
                  : 'bg-line-strong';

          return (
            // layout + a stable key make a bar slide to its new place when the value moves.
            <motion.div
              key={ids[position]}
              layout
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className={cx('flex w-8 flex-col items-center sm:w-9', !inRange && !isSorted && 'opacity-35')}
            >
              <span className="mb-1 font-mono text-xs text-ink tabular-nums">{value}</span>
              <div
                className={cx('w-full rounded-t-[4px] transition-colors duration-200', fill, isPivot && 'ring-2 ring-accent ring-offset-2 ring-offset-surface')}
                style={{ height: Math.max(6, (value / max) * PLOT_HEIGHT) }}
              />
              <span className="mt-1 font-mono text-[10px] text-muted tabular-nums">{position}</span>
              <span className="flex h-8 flex-col items-center font-mono text-[10px] leading-4 font-semibold text-ink">
                {isPivot && <span>pivot</span>}
                {(labels[position] ?? []).map((name) => (
                  <span key={name}>{name}</span>
                ))}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
