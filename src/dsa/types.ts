// Shared types for the array algorithms (sorting and searching).
//
// Like the ciphers, an algorithm's `run` function returns the list of steps
// it took. Each step is a snapshot of the array plus what to highlight.

export interface ArrayStep {
  /** The array at this moment. */
  array: number[];
  /** A stable id for each element, so the bars can slide when elements move. */
  ids: number[];
  /** Positions being compared in this step. */
  compare: number[];
  /** Positions that were just swapped or moved. */
  moved: number[];
  /** Positions known to hold their final value. */
  sorted: number[];
  /** The part of the array the algorithm is working on. Positions outside it are dimmed. */
  range?: [number, number];
  pivot?: number;
  /** For searches: the position where the target was found. */
  found?: number;
  /** Named markers shown under the bars, for example { low: 0, mid: 3, high: 7 }. */
  pointers: Record<string, number>;
  /** Plain-language description of the step. */
  note: string;
  /** Which line of the pseudocode this step belongs to. */
  line: number;
  /** Running totals up to and including this step. */
  comparisons: number;
  moves: number;
}

export interface Complexity {
  best: string;
  average: string;
  worst: string;
  space: string;
}

export interface Algorithm {
  id: string;
  name: string;
  group: 'Sorting' | 'Searching';
  summary: string;
  complexity: Complexity;
  /** Whether equal values keep their original order. Only meaningful for sorts. */
  stable?: boolean;
  howItWorks: string[];
  pseudocode: string[];
  /** Searches look for a target value. */
  needsTarget?: boolean;
  /** Binary search only works on sorted input, so the page sorts the values first. */
  needsSorted?: boolean;
  run(values: number[], target?: number): ArrayStep[];
}

type Snapshot = Partial<Pick<ArrayStep, 'compare' | 'moved' | 'range' | 'pivot' | 'found' | 'pointers'>> &
  Pick<ArrayStep, 'note' | 'line'>;

/**
 * Keeps the working array and records a step whenever `snap` is called.
 * The algorithms change the array only through `swap` and `moveTo`, so the
 * ids and the move counter stay in step with the values.
 */
export function createRecorder(values: number[]) {
  const a = [...values];
  const ids = values.map((_, index) => index);
  const sorted = new Set<number>();
  const steps: ArrayStep[] = [];
  let comparisons = 0;
  let moves = 0;

  return {
    /** The working array. Read from it freely; change it with swap or moveTo. */
    a,
    sorted,
    steps,
    countComparison() {
      comparisons++;
    },
    swap(i: number, j: number) {
      [a[i], a[j]] = [a[j], a[i]];
      [ids[i], ids[j]] = [ids[j], ids[i]];
      moves++;
    },
    /** Takes the element at `from` out and puts it back at `to`, sliding the ones in between along. */
    moveTo(from: number, to: number) {
      a.splice(to, 0, a.splice(from, 1)[0]);
      ids.splice(to, 0, ids.splice(from, 1)[0]);
      moves++;
    },
    snap(step: Snapshot) {
      steps.push({
        array: [...a],
        ids: [...ids],
        compare: step.compare ?? [],
        moved: step.moved ?? [],
        sorted: [...sorted],
        range: step.range,
        pivot: step.pivot,
        found: step.found,
        pointers: step.pointers ?? {},
        note: step.note,
        line: step.line,
        comparisons,
        moves,
      });
    },
    /** Marks every position as final and records the closing step. */
    finish(note: string, line: number) {
      for (let i = 0; i < a.length; i++) sorted.add(i);
      this.snap({ note, line });
    },
  };
}

export type Recorder = ReturnType<typeof createRecorder>;
