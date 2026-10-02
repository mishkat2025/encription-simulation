// Heap sort keeps its heap inside the array: the children of position i are at
// 2i + 1 and 2i + 2. This draws the same array as the tree it stands for, so
// "sift down" can be seen as a value moving down a branch.

import type { ArrayStep } from './types';
import { barState, type BarState } from './ArrayBars';

const WIDTH = 640;
const LEVEL_HEIGHT = 66;
const RADIUS = 18;

const fill: Record<BarState, string> = {
  found: 'var(--done)',
  moved: 'var(--swap)',
  compare: 'var(--compare)',
  sorted: 'var(--done)',
  idle: 'var(--raised)',
};

/** Where position i sits in the drawing. */
function place(i: number) {
  const depth = Math.floor(Math.log2(i + 1));
  const across = i - (2 ** depth - 1);
  return { x: ((across + 0.5) * WIDTH) / 2 ** depth, y: RADIUS + 8 + depth * LEVEL_HEIGHT };
}

/** How many positions at the front still form the heap. The rest are sorted and have left the tree. */
function heapSize(step: ArrayStep) {
  const n = step.array.length;
  if (step.range) return step.range[1] + 1;
  return step.sorted.length === n ? 0 : n;
}

export function HeapTree({ step }: { step: ArrayStep }) {
  const n = step.array.length;
  if (n === 0) return null;
  const size = heapSize(step);
  const depth = Math.floor(Math.log2(n));
  const height = RADIUS * 2 + 24 + depth * LEVEL_HEIGHT;

  return (
    <div className="rounded-xl border border-line bg-sunken px-3 py-4">
      <svg viewBox={`0 0 ${WIDTH} ${height}`} className="mx-auto block w-full max-w-2xl" role="img" aria-label="The array drawn as a binary tree">
        {step.array.map((_, i) => {
          if (i === 0) return null;
          const parent = Math.floor((i - 1) / 2);
          const from = place(parent);
          const to = place(i);
          const inHeap = i < size;
          return (
            <line
              key={`edge-${i}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="var(--line-strong)"
              strokeWidth={1.5}
              strokeDasharray={inHeap ? undefined : '4 4'}
              opacity={inHeap ? 1 : 0.5}
            />
          );
        })}
        {step.array.map((value, i) => {
          const { x, y } = place(i);
          const state = barState(step, i);
          const inHeap = i < size;
          const strong = state !== 'idle';
          return (
            <g key={`node-${i}`} opacity={inHeap || state === 'sorted' ? 1 : 0.4}>
              <circle
                cx={x}
                cy={y}
                r={RADIUS}
                fill={fill[state]}
                stroke={inHeap ? 'var(--line-strong)' : 'var(--muted)'}
                strokeDasharray={inHeap ? undefined : '3 3'}
                strokeWidth={1.5}
                style={{ transition: 'fill 0.2s' }}
              />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="var(--font-mono)"
                fontSize={13}
                fontWeight={700}
                fill={strong ? '#101216' : 'var(--ink)'}
              >
                {value}
              </text>
              <text x={x} y={y + RADIUS + 11} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={10} fill="var(--muted)">
                {i}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="m-0 mt-2 text-center text-xs text-muted">
        The same array as a tree. Dashed nodes have left the heap and are in their final place.
      </p>
    </div>
  );
}
