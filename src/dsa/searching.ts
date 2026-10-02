// The two searching algorithms. Each records every comparison it makes while
// looking for the target value.

import { createRecorder, type Algorithm } from './types';

export const linearSearch: Algorithm = {
  id: 'linear-search',
  name: 'Linear search',
  group: 'Searching',
  summary:
    'Check every value in turn until the target turns up or the array runs out. It works on any array, sorted or not.',
  complexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(1)' },
  howItWorks: [
    'Start at the first position and compare it with the target.',
    'Move one position right and repeat.',
    'In the worst case the target is last or missing, and every value gets checked.',
  ],
  pseudocode: ['for i from 0 to n − 1:', '  if a[i] = target: return i', 'return not found'],
  needsTarget: true,
  run(values, target = 0) {
    const r = createRecorder(values);
    const { a } = r;
    for (let i = 0; i < a.length; i++) {
      r.countComparison();
      if (a[i] === target) {
        r.snap({ compare: [i], found: i, pointers: { i }, line: 1, note: `${a[i]} is the target. Found at position ${i}.` });
        return r.steps;
      }
      r.snap({ compare: [i], pointers: { i }, line: 1, note: `${a[i]} is not ${target}. Move on.` });
    }
    r.snap({ line: 2, note: `Every value was checked and ${target} is not in the array.` });
    return r.steps;
  },
};

export const binarySearch: Algorithm = {
  id: 'binary-search',
  name: 'Binary search',
  group: 'Searching',
  summary:
    'On a sorted array, look at the middle value. If the target is smaller, throw away the right half; if larger, the left half. Each step halves what is left.',
  complexity: { best: 'O(1)', average: 'O(log n)', worst: 'O(log n)', space: 'O(1)' },
  howItWorks: [
    'The array must be sorted. That is what makes it safe to discard half of it.',
    'Compare the target with the middle value of the current range.',
    'Keep only the half that could still contain the target.',
    'A million values need at most 20 comparisons, where linear search could need a million.',
  ],
  pseudocode: [
    'low ← 0,  high ← n − 1',
    'while low ≤ high:',
    '  mid ← (low + high) / 2, rounded down',
    '  if a[mid] = target: return mid',
    '  if a[mid] < target: low ← mid + 1',
    '  else: high ← mid − 1',
    'return not found',
  ],
  needsTarget: true,
  needsSorted: true,
  run(values, target = 0) {
    const r = createRecorder(values);
    const { a } = r;
    let low = 0;
    let high = a.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const pointers = { low, mid, high };
      r.countComparison();
      if (a[mid] === target) {
        r.snap({ compare: [mid], found: mid, range: [low, high], pointers, line: 3, note: `The middle value ${a[mid]} is the target. Found at position ${mid}.` });
        return r.steps;
      }
      if (a[mid] < target) {
        r.snap({ compare: [mid], range: [low, high], pointers, line: 4, note: `The middle value ${a[mid]} is smaller than ${target}, so the target can only be to the right.` });
        low = mid + 1;
      } else {
        r.snap({ compare: [mid], range: [low, high], pointers, line: 5, note: `The middle value ${a[mid]} is larger than ${target}, so the target can only be to the left.` });
        high = mid - 1;
      }
    }
    // An empty range: nothing left to look at.
    r.snap({ range: [low, high], line: 6, note: `The range is empty, so ${target} is not in the array.` });
    return r.steps;
  },
};

export const searches: Algorithm[] = [linearSearch, binarySearch];
