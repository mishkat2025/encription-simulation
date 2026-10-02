import { describe, expect, it } from 'vitest';
import { binarySearch, linearSearch } from './searching';
import { bubbleSort, insertionSort, mergeSort, quickSort, selectionSort, sorts } from './sorting';

const ascending = (values: number[]) => [...values].sort((x, y) => x - y);

const inputs: [string, number[]][] = [
  ['a mixed array', [5, 3, 8, 1, 9, 2, 7]],
  ['an already sorted array', [1, 2, 3, 4, 5, 6]],
  ['a reversed array', [9, 7, 5, 3, 1]],
  ['repeated values', [4, 2, 4, 1, 2, 4, 1]],
  ['two values', [2, 1]],
  ['one value', [7]],
  ['sixteen values', [12, 45, 7, 23, 56, 89, 34, 1, 67, 90, 21, 43, 65, 8, 99, 3]],
];

describe.each(sorts.map((sort) => [sort.name, sort] as const))('%s', (_name, sort) => {
  it.each(inputs)('sorts %s', (_label, values) => {
    const steps = sort.run(values);
    const last = steps[steps.length - 1];
    expect(last.array).toEqual(ascending(values));
    // The closing step marks every position as final.
    expect(ascending(last.sorted)).toEqual(values.map((_, i) => i));
  });

  it('never loses or invents a value, and keeps ids matched to values', () => {
    const values = [5, 3, 8, 1, 9, 2, 7];
    for (const step of sort.run(values)) {
      expect(ascending(step.array)).toEqual(ascending(values));
      expect(step.ids.map((id) => values[id])).toEqual(step.array);
    }
  });

  it('does not change the input array', () => {
    const values = [3, 1, 2];
    sort.run(values);
    expect(values).toEqual([3, 1, 2]);
  });

  it('points every step at a real line of pseudocode', () => {
    for (const step of sort.run([5, 3, 8, 1, 9, 2, 7])) {
      expect(sort.pseudocode[step.line]).toBeDefined();
    }
  });
});

describe('comparison counts', () => {
  const comparisons = (steps: { comparisons: number }[]) => steps[steps.length - 1].comparisons;

  it('bubble sort stops after one pass on sorted input', () => {
    expect(comparisons(bubbleSort.run([1, 2, 3, 4, 5, 6]))).toBe(5);
  });

  it('selection sort always makes n(n − 1)/2 comparisons', () => {
    expect(comparisons(selectionSort.run([1, 2, 3, 4, 5, 6]))).toBe(15);
    expect(comparisons(selectionSort.run([6, 5, 4, 3, 2, 1]))).toBe(15);
  });

  it('insertion sort makes n − 1 comparisons on sorted input and n(n − 1)/2 on reversed input', () => {
    expect(comparisons(insertionSort.run([1, 2, 3, 4, 5, 6]))).toBe(5);
    expect(comparisons(insertionSort.run([6, 5, 4, 3, 2, 1]))).toBe(15);
  });

  it('quick sort hits its worst case on sorted input', () => {
    expect(comparisons(quickSort.run([1, 2, 3, 4, 5, 6]))).toBe(15);
  });

  it('merge sort stays near n log n even on reversed input', () => {
    expect(comparisons(mergeSort.run([8, 7, 6, 5, 4, 3, 2, 1]))).toBeLessThanOrEqual(17);
  });
});

describe('linear search', () => {
  it('finds a value and reports its position', () => {
    const steps = linearSearch.run([5, 3, 8, 1], 8);
    expect(steps[steps.length - 1].found).toBe(2);
    expect(steps).toHaveLength(3);
  });

  it('checks every value when the target is missing', () => {
    const steps = linearSearch.run([5, 3, 8, 1], 4);
    const last = steps[steps.length - 1];
    expect(last.found).toBeUndefined();
    expect(last.comparisons).toBe(4);
  });
});

describe('binary search', () => {
  const sorted = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31];

  it('finds every value in a sorted array', () => {
    sorted.forEach((value, index) => {
      const steps = binarySearch.run(sorted, value);
      expect(steps[steps.length - 1].found).toBe(index);
    });
  });

  it('needs at most log2(n) + 1 comparisons', () => {
    for (const target of [...sorted, 0, 2, 16, 40]) {
      const steps = binarySearch.run(sorted, target);
      expect(steps[steps.length - 1].comparisons).toBeLessThanOrEqual(5);
    }
  });

  it('reports a missing value', () => {
    const steps = binarySearch.run(sorted, 14);
    expect(steps[steps.length - 1].found).toBeUndefined();
  });
});
