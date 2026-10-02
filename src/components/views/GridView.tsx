// The view for the two keyless transposition ciphers (rail fence and
// columnar). Both work the same way: write the letters into a grid in one
// order, then read them out in a different order.

import { useEffect, useRef } from 'react';
import type { GridTrace, Mode } from '../../ciphers/types';
import { cx, inputTone, outputTone, ringTone, softTone } from '../ui';

const CELL = 40;
const GAP = 4;

export function GridView({ trace, step, mode }: { trace: GridTrace; step: number; mode: Mode }) {
  const scroller = useRef<HTMLDivElement>(null);
  const current = step > 0 ? trace.steps[step - 1] : undefined;
  const inTone = inputTone(mode);
  const outTone = outputTone(mode);

  // Replay the steps so far to find out what each cell holds right now.
  const written = new Map<string, string>();
  const read = new Map<string, string>();
  for (const s of trace.steps.slice(0, step)) {
    (s.phase === 'write' ? written : read).set(`${s.r},${s.c}`, s.ch);
  }

  // Keep the current cell in view when the grid is wider than the screen.
  const currentColumn = current?.c;
  useEffect(() => {
    const box = scroller.current;
    if (!box || currentColumn === undefined) return;
    const x = currentColumn * (CELL + GAP) + (trace.rowLabels ? 64 : 0);
    box.scrollTo({ left: x - box.clientWidth / 2 + CELL / 2, behavior: 'smooth' });
  }, [currentColumn, trace.rowLabels]);

  const phase = current?.phase ?? 'write';
  const { columnLabels, rowLabels } = trace;
  // The labels take the first row and column, so the letters move over by one.
  const rowOffset = columnLabels ? 1 : 0;
  const colOffset = rowLabels ? 1 : 0;

  return (
    <div className="space-y-4">
      <ol className="grid gap-2 sm:grid-cols-2">
        <PhaseCard number={1} active={phase === 'write'} caption={trace.writeCaption} />
        <PhaseCard number={2} active={phase === 'read'} caption={trace.readCaption} />
      </ol>

      <div ref={scroller} className="scroll-thin overflow-x-auto p-1 pb-3">
        <div
          className="mx-auto grid w-max font-mono"
          style={{
            gridTemplateColumns: `${rowLabels ? 'auto ' : ''}repeat(${trace.cols}, ${CELL}px)`,
            gridTemplateRows: `${columnLabels ? '24px ' : ''}repeat(${trace.rows}, ${CELL}px)`,
            gap: GAP,
          }}
        >
          {/* Column numbers above the table, and row or rail names on its left. The current ones light up. */}
          {columnLabels?.map((label, c) => (
            <div
              key={`col-${c}`}
              style={{ gridRow: 1, gridColumn: c + 1 + colOffset }}
              className={cx(
                'flex items-center justify-center rounded-md text-[11px] font-semibold tabular-nums transition-colors',
                current?.c === c ? 'bg-accent text-on-accent' : 'text-muted',
              )}
            >
              {label}
            </div>
          ))}
          {rowLabels?.map((label, r) => (
            <div
              key={`row-${r}`}
              style={{ gridRow: r + 1 + rowOffset, gridColumn: 1 }}
              className={cx(
                // Sticky, so the rail names stay in view while a long message scrolls sideways.
                'sticky left-0 z-20 flex items-center justify-end rounded-md px-2 font-sans text-xs font-semibold whitespace-nowrap transition-colors',
                current?.r === r ? 'bg-accent text-on-accent' : 'bg-surface text-muted',
              )}
            >
              {label}
            </div>
          ))}

          {trace.slots.map(({ r, c }) => {
            const id = `${r},${c}`;
            const isCurrent = current?.r === r && current.c === c;
            const readLetter = read.get(id);
            const writtenLetter = written.get(id);
            return (
              <div
                key={id}
                style={{ gridRow: r + 1 + rowOffset, gridColumn: c + 1 + colOffset }}
                className={cx(
                  'flex items-center justify-center rounded-lg border text-base transition-all duration-200',
                  readLetter !== undefined
                    ? cx(softTone[outTone], 'font-semibold text-ink')
                    : writtenLetter !== undefined
                      ? cx(softTone[inTone], 'font-semibold text-ink')
                      : 'border-dashed border-line-strong text-muted',
                  isCurrent && cx('z-10 scale-110 ring-2', ringTone[phase === 'read' ? outTone : inTone]),
                )}
              >
                {readLetter ?? writtenLetter ?? ''}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PhaseCard({ number, active, caption }: { number: number; active: boolean; caption: string }) {
  return (
    <li
      className={cx(
        'flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors',
        active ? 'border-line-strong bg-sunken text-ink' : 'border-line text-muted',
      )}
    >
      <span
        className={cx(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
          active ? 'bg-accent text-on-accent' : 'border border-line-strong',
        )}
      >
        {number}
      </span>
      <span className="pt-0.5">{caption}</span>
    </li>
  );
}
