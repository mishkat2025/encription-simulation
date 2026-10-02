// The view for the keyed transposition cipher. The current block is drawn as
// two rows of boxes with a line from each input position to where it lands.

import type { ReactNode } from 'react';
import type { Mode, PermutationTrace } from '../../ciphers/types';
import { ArrowRightIcon } from '../Icons';
import { Chip, cx, inputName, inputTone, outputName, outputTone, ringTone, softTone, type Tone } from '../ui';

const CELL = 44;
const GAP = 10;
const LINES_HEIGHT = 72;

/** Horizontal centre of the box at position j. */
const centre = (j: number) => j * (CELL + GAP) + CELL / 2;

export function PermutationView({ trace, step, mode }: { trace: PermutationTrace; step: number; mode: Mode }) {
  const current = step > 0 ? trace.steps[step - 1] : undefined;
  const inTone = inputTone(mode);
  const outTone = outputTone(mode);

  const blockIndex = current?.block ?? 0;
  const block = trace.blocks[blockIndex];
  // How many output positions of the current block are filled in.
  const filled = current ? current.to + 1 : 0;
  const width = trace.size * CELL + (trace.size - 1) * GAP;
  const activeKey = mode === 'encrypt' ? 'encrypt' : 'decrypt';

  return (
    <div className="space-y-5">
      <div className="grid gap-2 sm:grid-cols-2">
        <KeyCard title="Encryption key" values={trace.encKey} active={activeKey === 'encrypt'} />
        <KeyCard title="Decryption key (the inverse)" values={trace.decKey} active={activeKey === 'decrypt'} />
      </div>

      {block && (
        <div className="scroll-thin overflow-x-auto pb-2">
          <div className="mx-auto w-max font-mono">
            <RowLabel>
              {inputName(mode)} block {blockIndex + 1} of {trace.blocks.length}
            </RowLabel>
            <div className="flex" style={{ gap: GAP }}>
              {block.input.split('').map((ch, j) => (
                <Box key={j} position={j + 1} tone={inTone} highlighted={current?.from === j}>
                  {ch}
                </Box>
              ))}
            </div>

            <svg width={width} height={LINES_HEIGHT} className="block" aria-hidden="true">
              {trace.perm.map((from, to) => {
                const isCurrent = current?.to === to;
                return (
                  <line
                    key={to}
                    x1={centre(from)}
                    y1={2}
                    x2={centre(to)}
                    y2={LINES_HEIGHT - 2}
                    stroke={isCurrent ? 'var(--ink)' : 'var(--line-strong)'}
                    strokeWidth={isCurrent ? 2.5 : 1.5}
                    strokeLinecap="round"
                    opacity={isCurrent || to < filled ? 1 : 0.6}
                  />
                );
              })}
            </svg>

            <div className="flex" style={{ gap: GAP }}>
              {trace.perm.map((from, to) => (
                <Box key={to} position={to + 1} tone={outTone} highlighted={current?.to === to} empty={to >= filled} below>
                  {to < filled ? block.output[to] : ''}
                  <span className="sr-only">from position {from + 1}</span>
                </Box>
              ))}
            </div>
            <RowLabel>{outputName(mode)} block</RowLabel>
          </div>
        </div>
      )}

      <p className="min-h-5 text-center text-sm text-ink-2">
        {current
          ? `Position ${current.to + 1} of the output takes the letter from position ${current.from + 1} of the input.`
          : 'Press play, or step forward, to move the letters one at a time.'}
      </p>

      {/* Every block in the message */}
      <div className="flex flex-wrap gap-2">
        {trace.blocks.map((b, i) => (
          <div
            key={i}
            className={cx(
              'flex items-center gap-1.5 rounded-lg border px-2 py-1.5 transition-colors',
              i === blockIndex && current ? 'border-line-strong bg-sunken' : 'border-line',
            )}
          >
            <Chip tone={inTone}>{b.input}</Chip>
            <span className="text-muted">
              <ArrowRightIcon />
            </span>
            {current && i < blockIndex ? (
              <Chip tone={outTone}>{b.output}</Chip>
            ) : current && i === blockIndex ? (
              <Chip tone={outTone}>{b.output.slice(0, filled).padEnd(trace.size, '·')}</Chip>
            ) : (
              <span className="px-1.5 font-mono text-sm text-muted">{'·'.repeat(trace.size)}</span>
            )}
          </div>
        ))}
      </div>

      {trace.padding > 0 && (
        <p className="text-sm text-ink-2">
          {trace.padding === 1 ? 'One bogus letter z was' : `${trace.padding} bogus letters z were`} added to fill the
          last block.
        </p>
      )}
    </div>
  );
}

function KeyCard({ title, values, active }: { title: string; values: number[]; active: boolean }) {
  return (
    <div className={cx('rounded-lg border px-3 py-2.5', active ? 'border-line-strong bg-sunken' : 'border-line')}>
      <div className="flex items-center justify-between gap-2 text-xs text-ink-2">
        <span>{title}</span>
        {active && <span className="font-medium text-ink">in use</span>}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {values.map((value, i) => (
          <Chip key={i} tone="key">
            {value}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function RowLabel({ children }: { children: ReactNode }) {
  return <div className="py-1.5 text-center font-sans text-xs text-ink-2">{children}</div>;
}

function Box({
  children,
  position,
  tone,
  highlighted,
  empty,
  below,
}: {
  children: ReactNode;
  position: number;
  tone: Tone;
  highlighted: boolean;
  empty?: boolean;
  /** Put the position number under the box instead of above it. */
  below?: boolean;
}) {
  const number = <span className="text-center text-[10px] leading-4 text-muted tabular-nums">{position}</span>;
  return (
    <div className="flex flex-col" style={{ width: CELL }}>
      {!below && number}
      <div
        style={{ height: CELL }}
        className={cx(
          'flex items-center justify-center rounded-md border text-base transition-all duration-200',
          empty ? 'border-dashed border-line-strong' : cx(softTone[tone], 'font-semibold text-ink'),
          highlighted && cx('ring-2', ringTone[tone]),
        )}
      >
        {children}
      </div>
      {below && number}
    </div>
  );
}
