// The page for one sorting or searching algorithm: the array to work on, the
// animated bars, a description of each step, and the code in five forms.

import { useMemo, useState } from 'react';
import { PlayerControls } from '../components/PlayerControls';
import { Card, ErrorNote, PageHeader, PresetButton, cx } from '../components/ui';
import { usePlayer, usePlayerKeys } from '../hooks/usePlayer';
import { ArrayBars } from './ArrayBars';
import { CodePanel } from './CodePanel';
import { HeapTree } from './HeapTree';
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

  const stats = [
    { label: 'Best', value: algorithm.complexity.best },
    { label: 'Average', value: algorithm.complexity.average },
    { label: 'Worst', value: algorithm.complexity.worst },
    { label: 'Extra memory', value: algorithm.complexity.space },
    ...(algorithm.stable === undefined ? [] : [{ label: 'Stable', value: algorithm.stable ? 'Yes' : 'No' }]),
  ];

  return (
    <>
      <PageHeader tags={['Algorithms', algorithm.group]} title={algorithm.name} summary={algorithm.summary} stats={stats} />

      <Card title={algorithm.needsTarget ? 'Array and target' : 'Array'}>
        <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
          <label className="min-w-0 flex-1 basis-72">
            <span className="mb-1.5 block text-sm font-medium text-ink">Values</span>
            <input
              type="text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              spellCheck={false}
              autoComplete="off"
              className="h-10 w-full min-w-0 rounded-lg border border-line-strong bg-sunken px-3 font-mono text-sm text-ink"
            />
            <span className="mt-1.5 block text-xs text-muted">
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
                className="h-10 w-24 rounded-lg border border-line-strong bg-sunken px-3 font-mono text-sm text-ink"
              />
            </label>
          )}
          <div className="min-w-0 basis-full xl:basis-auto">
            <span className="mb-1.5 block text-sm font-medium text-ink">Try an input</span>
            <div className="flex flex-wrap gap-2 xl:h-10 xl:items-center">
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
        </div>
        {error && <ErrorNote>{error}</ErrorNote>}
      </Card>

      <Card
        title="Step by step"
        action={
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Swatch className="bg-compare">Comparing</Swatch>
            {isSort && <Swatch className="bg-swap">Just moved</Swatch>}
            <Swatch className="bg-done">{isSort ? 'In final place' : 'Found'}</Swatch>
            {isSort && <Swatch className="bg-bar">Not sorted yet</Swatch>}
          </div>
        }
      >
        {values && steps.length > 0 ? (
          <div className="flex flex-col gap-5">
            <PlayerControls player={player} />

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] 2xl:grid-cols-[minmax(0,1fr)_minmax(0,32rem)]">
              <div className="flex min-w-0 flex-col gap-4">
                <ArrayBars step={shown} max={Math.max(...values)} />
                {algorithm.showHeapTree && <HeapTree step={shown} />}
                <p
                  aria-live="polite"
                  className="m-0 min-h-12 rounded-xl border-l-4 border-accent-ink bg-accent-soft px-4 py-3 text-sm leading-relaxed text-ink"
                >
                  {current ? current.note : 'Press play, or step forward, to watch the algorithm work.'}
                </p>
                <dl className="m-0 grid grid-cols-3 gap-2.5">
                  <Counter label="Comparisons" value={shown.comparisons} />
                  {isSort ? <Counter label="Swaps and moves" value={shown.moves} /> : <Counter label="Step" value={player.step} />}
                  <Counter label="Values" value={values.length} />
                </dl>
              </div>

              <CodePanel algorithmId={algorithm.id} pseudocode={algorithm.pseudocode} line={current ? shown.line : -1} />
            </div>
          </div>
        ) : (
          <p className="m-0 text-sm text-ink-2">Fix the input above to see the steps.</p>
        )}
      </Card>

      <Card title="How it works">
        <ol className="m-0 max-w-3xl list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink-2 marker:font-semibold marker:text-accent-ink">
          {algorithm.howItWorks.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      </Card>
    </>
  );
}

function Swatch({ className, children }: { className: string; children: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-2">
      <span className={cx('h-2.5 w-2.5 rounded-sm', className)} />
      {children}
    </span>
  );
}

function Counter({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-sunken px-3.5 py-2.5">
      <dt className="text-[11px] font-semibold tracking-wider text-muted uppercase">{label}</dt>
      <dd className="m-0 mt-0.5 font-mono text-xl font-semibold text-ink tabular-nums">{value}</dd>
    </div>
  );
}
