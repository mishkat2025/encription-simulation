// A bar chart of how often each letter appears, built from plain HTML and CSS.
// Two of these are stacked on the "Break it" tab: typical English above, the
// ciphertext below, on the same scale so their shapes can be compared.

import { useState } from 'react';
import { cx, dotTone } from './ui';

interface Props {
  title: string;
  subtitle: string;
  /** One label per bar, for example a-z. */
  labels: string[];
  /** Height of each bar, in percent of all letters. */
  values: number[];
  /** Raw counts, shown in the tooltip and table when given. */
  counts?: number[];
  tone: 'plain' | 'cipher';
  /** Top of the scale, shared by both charts. */
  yMax: number;
  /** Index of a bar to label with its value. */
  highlight?: number;
}

const PLOT_HEIGHT = 150;

export function FrequencyChart({ title, subtitle, labels, values, counts, tone, yMax, highlight }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const ticks = Array.from({ length: yMax / 5 + 1 }, (_, i) => i * 5);
  const describe = (i: number) =>
    counts ? `${counts[i]} ${counts[i] === 1 ? 'time' : 'times'} (${values[i].toFixed(1)}%)` : `${values[i].toFixed(1)}%`;

  return (
    <figure className="m-0">
      <figcaption className="mb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <span className={cx('h-2.5 w-2.5 rounded-sm', dotTone[tone])} />
          {title}
        </div>
        <p className="mt-0.5 text-xs text-ink-2">{subtitle}</p>
      </figcaption>

      <div className="flex">
        {/* y axis labels */}
        <div className="relative w-9 shrink-0" style={{ height: PLOT_HEIGHT }}>
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute right-2 translate-y-1/2 text-[10px] text-muted tabular-nums"
              style={{ bottom: (tick / yMax) * PLOT_HEIGHT }}
            >
              {tick}%
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className="relative" style={{ height: PLOT_HEIGHT }} onMouseLeave={() => setHovered(null)}>
            {/* gridlines */}
            {ticks.map((tick) => (
              <div
                key={tick}
                className={cx('absolute inset-x-0 border-t', tick === 0 ? 'border-line-strong' : 'border-line')}
                style={{ bottom: (tick / yMax) * PLOT_HEIGHT }}
              />
            ))}

            {/* bars: each column is a hover target as tall as the plot */}
            <div className="absolute inset-0 flex">
              {values.map((value, i) => (
                <div
                  key={i}
                  className="relative flex h-full flex-1 items-end justify-center px-px"
                  onMouseEnter={() => setHovered(i)}
                >
                  {i === highlight && (
                    <span
                      className="absolute text-[10px] font-semibold whitespace-nowrap text-ink tabular-nums"
                      style={{ bottom: (value / yMax) * PLOT_HEIGHT + 3 }}
                    >
                      {value.toFixed(1)}%
                    </span>
                  )}
                  <div
                    className={cx(
                      'w-full max-w-6 rounded-t-[4px] transition-[height,opacity] duration-300',
                      dotTone[tone],
                      hovered !== null && hovered !== i && 'opacity-50',
                    )}
                    style={{ height: (value / yMax) * PLOT_HEIGHT }}
                  />
                </div>
              ))}
            </div>

            {hovered !== null && (
              <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-md border border-line-strong bg-surface px-2 py-1 text-xs whitespace-nowrap text-ink shadow-sm"
                style={{
                  left: `${Math.min(Math.max(((hovered + 0.5) / values.length) * 100, 12), 88)}%`,
                  bottom: Math.min((values[hovered] / yMax) * PLOT_HEIGHT + 8, PLOT_HEIGHT - 24),
                }}
              >
                <span className="font-mono font-semibold">{labels[hovered]}</span>
                <span className="ml-2 text-ink-2">{describe(hovered)}</span>
              </div>
            )}
          </div>

          {/* x axis labels */}
          <div className="mt-1 flex">
            {labels.map((label, i) => (
              <span
                key={i}
                className={cx(
                  'flex-1 text-center font-mono text-[11px]',
                  i === highlight ? 'font-bold text-ink' : 'text-ink-2',
                )}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <details className="mt-2 text-xs text-ink-2">
        <summary className="cursor-pointer select-none">Show as a table</summary>
        <table className="mt-2 border-collapse tabular-nums">
          <thead>
            <tr className="text-left">
              <th className="border-b border-line py-1 pr-6 font-medium">Letter</th>
              {counts && <th className="border-b border-line py-1 pr-6 font-medium">Count</th>}
              <th className="border-b border-line py-1 font-medium">Share</th>
            </tr>
          </thead>
          <tbody>
            {labels.map((label, i) => (
              <tr key={i}>
                <td className="py-0.5 pr-6 font-mono">{label}</td>
                {counts && <td className="py-0.5 pr-6">{counts[i]}</td>}
                <td className="py-0.5">{values[i].toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
