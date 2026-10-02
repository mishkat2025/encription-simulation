// The Playfair view: the 5×5 key square on the left, and the rule that
// applies to the current pair of letters on the right.

import { motion } from 'motion/react';
import type { Mode, PlayfairStep, PlayfairTrace, Pos } from '../../ciphers/types';
import { ArrowRightIcon } from '../Icons';
import { Chip, cx, inputTone, outputTone, ringTone, softTone } from '../ui';

// Sizes in pixels, so the outline around a row, column or rectangle can be positioned exactly.
const CELL = 44;
const GAP = 6;
const PAD = 4;

const samePos = (a: Pos, b: Pos) => a[0] === b[0] && a[1] === b[1];

/** The area to outline: the whole row, the whole column, or the rectangle between the two letters. */
function outlineFor(step: PlayfairStep) {
  const [a, b] = step.inPos;
  let top = Math.min(a[0], b[0]);
  let bottom = Math.max(a[0], b[0]);
  let left = Math.min(a[1], b[1]);
  let right = Math.max(a[1], b[1]);
  if (step.rule === 'row') [left, right] = [0, 4];
  if (step.rule === 'column') [top, bottom] = [0, 4];
  return {
    top: top * (CELL + GAP) - PAD,
    left: left * (CELL + GAP) - PAD,
    width: (right - left) * (CELL + GAP) + CELL + PAD * 2,
    height: (bottom - top) * (CELL + GAP) + CELL + PAD * 2,
  };
}

function ruleText(rule: PlayfairStep['rule'], mode: Mode): { title: string; text: string } {
  const encrypting = mode === 'encrypt';
  if (rule === 'row') {
    return {
      title: 'Same row',
      text: encrypting
        ? 'Both letters are in the same row. Take the letter to the right of each one, going back to the start of the row at the end.'
        : 'Both letters are in the same row. Take the letter to the left of each one, going to the end of the row from the start.',
    };
  }
  if (rule === 'column') {
    return {
      title: 'Same column',
      text: encrypting
        ? 'Both letters are in the same column. Take the letter below each one, going back to the top from the bottom.'
        : 'Both letters are in the same column. Take the letter above each one, going to the bottom from the top.',
    };
  }
  return {
    title: 'Rectangle',
    text: 'The letters are in different rows and columns, so they are two corners of a rectangle. Each letter is replaced by the other corner in its own row.',
  };
}

export function PlayfairView({ trace, step, mode }: { trace: PlayfairTrace; step: number; mode: Mode }) {
  const current = step > 0 ? trace.steps[step - 1] : undefined;
  const inTone = inputTone(mode);
  const outTone = outputTone(mode);
  const rule = current && ruleText(current.rule, mode);

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
        {/* The key square */}
        <div
          className="relative grid shrink-0"
          style={{ gridTemplateColumns: `repeat(5, ${CELL}px)`, gap: GAP, margin: PAD }}
        >
          {trace.square.split('').map((ch, index) => {
            const pos: Pos = [Math.floor(index / 5), index % 5];
            const isInput = current?.inPos.some((p) => samePos(p, pos));
            const isOutput = current?.outPos.some((p) => samePos(p, pos));
            return (
              <div
                key={ch}
                style={{ height: CELL }}
                className={cx(
                  'flex items-center justify-center rounded-md border font-mono text-base uppercase transition-colors duration-200',
                  isOutput ? softTone[outTone] : isInput ? softTone[inTone] : 'border-line bg-surface text-ink-2',
                  (isInput || isOutput) && 'font-semibold text-ink ring-2',
                  // A cell can be both: the ring shows it was typed in, the fill shows it is also a result.
                  isInput ? ringTone[inTone] : isOutput && ringTone[outTone],
                )}
              >
                {ch === 'i' ? 'i/j' : ch}
              </div>
            );
          })}
          {current && (
            <motion.div
              className="pointer-events-none absolute rounded-xl border-2 border-dashed border-line-strong"
              initial={false}
              animate={outlineFor(current)}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            />
          )}
        </div>

        {/* The rule for the current pair */}
        <div className="min-h-44 w-full flex-1 rounded-lg bg-sunken p-4">
          {current && rule ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Chip tone={inTone} large>
                  {current.input}
                </Chip>
                <span className="text-muted">
                  <ArrowRightIcon />
                </span>
                <Chip tone={outTone} large>
                  {current.result}
                </Chip>
                <span className="text-xs text-ink-2">
                  Pair {step} of {trace.steps.length}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink">{rule.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-2">{rule.text}</p>
              </div>
              <p className="font-mono text-sm text-ink">
                {current.input[0]} → {current.result[0]}
                <span className="mx-3 text-muted">·</span>
                {current.input[1]} → {current.result[1]}
              </p>
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-ink-2">
              The message is split into pairs of letters. Press play, or step forward, to see which rule each pair
              follows in the key square.
            </p>
          )}
        </div>
      </div>

      {/* Every pair in the message */}
      <div className="flex flex-wrap gap-2">
        {trace.steps.map((s, i) => (
          <div
            key={i}
            className={cx(
              'flex items-center gap-1.5 rounded-lg border px-2 py-1.5 transition-colors',
              i === step - 1 ? 'border-line-strong bg-sunken' : 'border-line',
            )}
          >
            <Chip tone={inTone}>{s.input}</Chip>
            <span className="text-muted">
              <ArrowRightIcon />
            </span>
            {i < step ? <Chip tone={outTone}>{s.result}</Chip> : <span className="w-9 text-center text-muted">··</span>}
          </div>
        ))}
      </div>

      {trace.prep.length > 0 && (
        <ul className="space-y-1 text-sm text-ink-2">
          {trace.prep.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
