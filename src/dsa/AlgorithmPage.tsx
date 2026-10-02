// The page for one sorting or searching algorithm: the array to work on, the
// animated bars, a description of each step, and the pseudocode.

import { useMemo, useState } from 'react';
import { PlayerControls } from '../components/PlayerControls';
import { Card, ErrorNote, LegendDot, PageHeader, PresetButton, cx } from '../components/ui';
import { usePlayer, usePlayerKeys } from '../hooks/usePlayer';
import { ArrayBars } from './ArrayBars';
import type { Algorithm } from './types';

const MAX_VALUES = 16;
const MAX_VALUE = 99;
const DEFAULT_VALUES = '34, 12, 78, 5, 56, 91, 23, 67, 45, 8';

const randomInt = (low: number, high: number) => low + Math.floor(Math.random() * (high - low + 1));
const randomValues = (count = 10) => Array.from({ length: count }, () => randomInt(1, MAX_VALUE));

/** Ready-made inputs. Each one shows a different side of an algorithm. */
const PRESETS: { label: string; make: () => number[] }[] = [
  { label: 'Random', make: () => randomValues() },
  {
    label: 'Nearly sorted',
    make: () => {
      const values = randomValues().sort((x, y) => x - y);
      const i = randomInt(0, values.length - 2);
      [values[i], values[i + 1]] = [values[i + 1], values[i]];
      return values;
    },
  },
  { label: 'Reversed', make: () => randomValues().sort((x, y) => y - x) },
  { label: 'Few different values', make: () => Array.from({ length: 10 }, () => randomInt(1, 4) * 20) },
];

/** Reads "5, 3, 8" into numbers, or explains what is wrong with it. */
function parseValues(text: string): { values?: number[]; error?: string } {
  const parts = text.split(/[\s,]+/).filter(Boolean);
  if (parts.length === 0) return { error: 'Enter some numbers, separated by commas.' };
  if (parts.length > MAX_VALUES) return { error: `Use at most ${MAX_VALUES} numbers so every bar fits.` };
  const values = parts.map(Number);
  const bad = parts.find((_, i) => !Number.isInteger(values[i]) || values[i] < 1 || values[i] > MAX_VALUE);
  if (bad !== undefined) return { error: `"${bad}" is not a whole number from 1 to ${MAX_VALUE}.` };
  return { values };
}

export function AlgorithmPage({ algorithm }: { algorithm: Algorithm }) {
  const [text, setText] = useState(DEFAULT_VALUES);
  const [targetText, setTargetText] = useState('56');

  const parsed = useMemo(() => parseValues(text), [text]);
  const target = Number(targetText);
  const targetError =
    algorithm.needsTarget && (!Number.isInteger(target) || targetText.trim() === '')
      ? 'The target must be a whole number.'
      : undefined;
  const error = parsed.error ?? targetError;

  // Binary search only works on sorted input, so sort the values for it first.
  const values = useMemo(() => {
    if (!parsed.values) return undefined;
    return algorithm.needsSorted ? [...parsed.values].sort((x, y) => x - y) : parsed.values;
  }, [parsed.values, algorithm]);

  const steps = useMemo(
    () => (values && !targetError ? algorithm.run(values, target) : []),
    [algorithm, values, target, targetError],
  );
  const player = usePlayer(steps.length, steps);
  usePlayerKeys(player);

  // Before the first step, show the untouched input.
  const current = player.step > 0 ? steps[player.step - 1] : undefined;
  const shown = current ?? {
    array: values ?? [],
    ids: (values ?? []).map((_, i) => i),
    compare: [],
    moved: [],
    sorted: [],
    pointers: {},
    note: '',
    line: -1,
    comparisons: 0,
    moves: 0,
  };
  const isSort = algorithm.group === 'Sorting';

  return (
    <>
      <PageHeader tags={[algorithm.group, `${algorithm.complexity.average} on average`]} title={algorithm.name} summary={algorithm.summary} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <Card title={algorithm.needsTarget ? 'Array and target' : 'Array'}>
          <div className="flex flex-wrap items-start gap-4">
            <label className="min-w-0 flex-1 basis-72">
              <span className="mb-1.5 block text-sm font-medium text-ink">Values</span>
              <input
                type="text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                spellCheck={false}
                autoComplete="off"
                className="h-10 w-full min-w-0 rounded-lg border border-line-strong bg-surface px-3 font-mono text-sm text-ink"
              />
              <span className="mt-1.5 block text-xs text-ink-2">
                Up to {MAX_VALUES} whole numbers from 1 to {MAX_VALUE}, separated by commas.
                {algorithm.needsSorted && ' They are sorted first, because binary search needs sorted input.'}
              </span>
            </label>
            {algorithm.needsTarget && (
              <label>
                <span className="mb-1.5 block text-sm font-medium text-ink">Target</span>
                <input
                  type="number"
                  value={targetText}
                  onChange={(event) => setTargetText(event.target.value)}
                  className="h-10 w-24 rounded-lg border border-line-strong bg-surface px-3 font-mono text-sm text-ink"
                />
              </label>
            )}
          </div>
          {error && <ErrorNote>{error}</ErrorNote>}
          <div className="mt-5 border-t border-line pt-4">
            <p className="mb-2 text-xs font-medium text-ink-2">Try an input</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <PresetButton key={preset.label} onClick={() => setText(preset.make().join(', '))}>
                  {preset.label}
                </PresetButton>
              ))}
              {algorithm.needsTarget && values && values.length > 0 && (
                <PresetButton onClick={() => setTargetText(String(values[randomInt(0, values.length - 1)]))}>
                  Pick a target from the array
                </PresetButton>
              )}
            </div>
          </div>
        </Card>

        <div className="order-last min-w-0 xl:order-none">
          <Card title="How it works">
            <table className="mb-4 w-full border-collapse text-sm">
              <tbody>
                {(
                  [
                    ['Best case', algorithm.complexity.best],
                    ['Average', algorithm.complexity.average],
                    ['Worst case', algorithm.complexity.worst],
                    ['Extra memory', algorithm.complexity.space],
                    ...(algorithm.stable === undefined ? [] : [['Stable', algorithm.stable ? 'Yes' : 'No']]),
                  ] as [string, string][]
                ).map(([label, value]) => (
                  <tr key={label}>
                    <th className="border-b border-line py-1.5 pr-3 text-left text-xs font-normal text-ink-2">{label}</th>
                    <td className="border-b border-line py-1.5 text-right font-mono text-ink">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink-2">
              {algorithm.howItWorks.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="min-w-0 xl:col-span-2">
          <Card
            title="Step by step"
            action={
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <LegendDot tone="plain">Comparing</LegendDot>
                {isSort && <LegendDot tone="cipher">Just moved</LegendDot>}
                <LegendDot tone="key">{isSort ? 'In final place' : 'Found'}</LegendDot>
              </div>
            }
          >
            {values && steps.length > 0 ? (
              <div className="flex flex-col gap-5">
                <PlayerControls player={player} />

                <div className="grid gap-5 border-t border-line pt-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
                  <div className="flex min-w-0 flex-col gap-4">
                    <ArrayBars step={shown} max={Math.max(...values)} />
                    <p className="m-0 min-h-12 rounded-lg bg-sunken px-4 py-3 text-sm leading-relaxed text-ink">
                      {current ? current.note : 'Press play, or step forward, to watch the algorithm work.'}
                    </p>
                    <dl className="m-0 flex flex-wrap gap-x-8 gap-y-2 text-sm">
                      <div>
                        <dt className="text-xs text-ink-2">Comparisons</dt>
                        <dd className="m-0 font-mono text-lg font-semibold text-ink tabular-nums">{shown.comparisons}</dd>
                      </div>
                      {isSort && (
                        <div>
                          <dt className="text-xs text-ink-2">Swaps and moves</dt>
                          <dd className="m-0 font-mono text-lg font-semibold text-ink tabular-nums">{shown.moves}</dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-xs text-ink-2">Values</dt>
                        <dd className="m-0 font-mono text-lg font-semibold text-ink tabular-nums">{values.length}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="min-w-0">
                    <h3 className="m-0 mb-2 text-xs font-medium text-ink-2">Pseudocode</h3>
                    <ol className="m-0 list-none rounded-lg border border-line p-1.5 font-mono text-xs leading-relaxed">
                      {algorithm.pseudocode.map((line, index) => (
                        <li
                          key={index}
                          className={cx(
                            'rounded px-2 py-1 whitespace-pre-wrap transition-colors',
                            index === shown.line ? 'bg-accent font-semibold text-on-accent' : 'text-ink-2',
                          )}
                        >
                          {line}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-ink-2">Fix the input above to see the steps.</p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
