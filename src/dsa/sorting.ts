// The six sorting algorithms. Each one sorts a copy of the input and records
// every comparison and move, so the page can replay them.

import { createRecorder, type Algorithm, type Recorder } from './types';

const DONE = 'Every value is in its final position. The array is sorted.';

export const bubbleSort: Algorithm = {
  id: 'bubble-sort',
  name: 'Bubble sort',
  group: 'Sorting',
  summary:
    'Walk along the array comparing neighbours and swap any pair that is out of order. After each pass the largest remaining value has "bubbled" to the end.',
  complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
  stable: true,
  howItWorks: [
    'Compare each pair of neighbours, left to right, and swap them if the left one is larger.',
    'One pass moves the largest unsorted value to the end, so the next pass can stop one position earlier.',
    'If a whole pass makes no swaps, the array is already sorted and the algorithm stops early.',
  ],
  pseudocode: [
    'for pass from 0 to n − 2:',
    '  for j from 0 to n − 2 − pass:',
    '    if a[j] > a[j + 1]:',
    '      swap a[j] and a[j + 1]',
    '  the last unsorted position is now final',
    '  if the pass made no swaps: stop',
  ],
  run(values) {
    const r = createRecorder(values);
    const { a } = r;
    const n = a.length;
    for (let pass = 0; pass < n - 1; pass++) {
      let swapped = false;
      const end = n - 1 - pass;
      for (let j = 0; j < end; j++) {
        r.countComparison();
        const outOfOrder = a[j] > a[j + 1];
        r.snap({
          compare: [j, j + 1],
          range: [0, end],
          pointers: { j },
          line: 2,
          note: outOfOrder
            ? `${a[j]} is larger than ${a[j + 1]}, so they are out of order.`
            : `${a[j]} is not larger than ${a[j + 1]}, so they stay.`,
        });
        if (outOfOrder) {
          r.swap(j, j + 1);
          swapped = true;
          r.snap({ moved: [j, j + 1], range: [0, end], pointers: { j }, line: 3, note: `Swap them: ${a[j + 1]} moves right.` });
        }
      }
      r.sorted.add(end);
      r.snap({ line: 4, note: `${a[end]} is the largest of the unsorted values, so position ${end} is final.` });
      if (!swapped) {
        r.finish('That pass made no swaps, so everything is already in order.', 5);
        return r.steps;
      }
    }
    r.finish(DONE, 4);
    return r.steps;
  },
};

export const selectionSort: Algorithm = {
  id: 'selection-sort',
  name: 'Selection sort',
  group: 'Sorting',
  summary:
    'Find the smallest value in the unsorted part and swap it to the front. Repeat with the rest. It makes few swaps but always scans everything.',
  complexity: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
  stable: false,
  howItWorks: [
    'Scan the unsorted part and remember where the smallest value is.',
    'Swap that value into the first unsorted position. That position is now final.',
    'It makes at most n − 1 swaps, but the number of comparisons is the same for any input.',
  ],
  pseudocode: [
    'for i from 0 to n − 2:',
    '  min ← i',
    '  for j from i + 1 to n − 1:',
    '    if a[j] < a[min]: min ← j',
    '  swap a[i] and a[min]',
  ],
  run(values) {
    const r = createRecorder(values);
    const { a } = r;
    const n = a.length;
    for (let i = 0; i < n - 1; i++) {
      let min = i;
      r.snap({ range: [i, n - 1], pointers: { i, min }, line: 1, note: `Start a scan at position ${i}. The smallest value so far is ${a[i]}.` });
      for (let j = i + 1; j < n; j++) {
        r.countComparison();
        const smaller = a[j] < a[min];
        const note = smaller
          ? `${a[j]} is smaller than ${a[min]}, so it is the new smallest.`
          : `${a[j]} is not smaller than ${a[min]}.`;
        r.snap({ compare: [j, min], range: [i, n - 1], pointers: { i, j, min }, line: 3, note });
        if (smaller) min = j;
      }
      if (min !== i) {
        r.swap(i, min);
        r.sorted.add(i);
        r.snap({ moved: [i, min], pointers: { i }, line: 4, note: `Swap the smallest value, ${a[i]}, into position ${i}.` });
      } else {
        r.sorted.add(i);
        r.snap({ pointers: { i }, line: 4, note: `${a[i]} is already the smallest, so it stays at position ${i}.` });
      }
    }
    r.finish(DONE, 4);
    return r.steps;
  },
};

export const insertionSort: Algorithm = {
  id: 'insertion-sort',
  name: 'Insertion sort',
  group: 'Sorting',
  summary:
    'Grow a sorted section at the front. Take the next value and slide it left until it sits in the right place, the way people sort a hand of cards.',
  complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
  stable: true,
  howItWorks: [
    'The first value on its own counts as a sorted section.',
    'Take the next value and swap it leftwards past every larger value.',
    'It is fast on input that is already nearly sorted, because each value only moves a little.',
  ],
  pseudocode: [
    'for i from 1 to n − 1:',
    '  j ← i',
    '  while j > 0 and a[j − 1] > a[j]:',
    '    swap a[j − 1] and a[j]',
    '    j ← j − 1',
  ],
  run(values) {
    const r = createRecorder(values);
    const { a } = r;
    for (let i = 1; i < a.length; i++) {
      let j = i;
      r.snap({ range: [0, i], pointers: { i }, line: 1, note: `Take ${a[i]} and insert it into the sorted section on its left.` });
      while (j > 0) {
        r.countComparison();
        const larger = a[j - 1] > a[j];
        r.snap({
          compare: [j - 1, j],
          range: [0, i],
          pointers: { i, j },
          line: 2,
          note: larger
            ? `${a[j - 1]} is larger than ${a[j]}, so ${a[j]} must move left.`
            : `${a[j - 1]} is not larger than ${a[j]}, so ${a[j]} is in the right place.`,
        });
        if (!larger) break;
        r.swap(j - 1, j);
        j--;
        r.snap({ moved: [j, j + 1], range: [0, i], pointers: { i, j }, line: 3, note: `Swap: ${a[j]} moves one place left.` });
      }
    }
    r.finish(DONE, 0);
    return r.steps;
  },
};

export const mergeSort: Algorithm = {
  id: 'merge-sort',
  name: 'Merge sort',
  group: 'Sorting',
  summary:
    'Split the array in half, sort each half, then merge the two sorted halves. Merging is easy because only the front of each half needs comparing.',
  complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)' },
  stable: true,
  howItWorks: [
    'Keep splitting until every piece has one value. One value is already sorted.',
    'Merge two sorted pieces by repeatedly taking the smaller of their two front values.',
    'There are about log n levels of splitting and each level does n work, which gives n log n every time.',
    'A real merge copies values into a spare array. The picture shows the same result as a slide, so no value is ever hidden.',
  ],
  pseudocode: [
    'mergeSort(lo, hi):',
    '  if lo ≥ hi: return',
    '  mid ← (lo + hi) / 2',
    '  mergeSort(lo, mid)  and  mergeSort(mid + 1, hi)',
    '  merge the two sorted halves:',
    '    compare the front of each half',
    '    take the smaller one next',
  ],
  run(values) {
    const r = createRecorder(values);
    const { a } = r;

    const sort = (lo: number, hi: number) => {
      if (lo >= hi) return;
      const mid = Math.floor((lo + hi) / 2);
      r.snap({ range: [lo, hi], pointers: { lo, mid, hi }, line: 2, note: `Split positions ${lo} to ${hi} into ${lo} to ${mid} and ${mid + 1} to ${hi}.` });
      sort(lo, mid);
      sort(mid + 1, hi);

      r.snap({ range: [lo, hi], pointers: { lo, hi }, line: 4, note: `Both halves of ${lo} to ${hi} are sorted. Merge them.` });
      // i is the front of the left half, j the front of the right half.
      let i = lo;
      let j = mid + 1;
      while (i < j && j <= hi) {
        r.countComparison();
        const takeRight = a[j] < a[i];
        r.snap({
          compare: [i, j],
          range: [lo, hi],
          pointers: { left: i, right: j },
          line: 5,
          note: takeRight
            ? `${a[j]} from the right half is smaller than ${a[i]}, so it goes next.`
            : `${a[i]} from the left half is not larger than ${a[j]}, so it goes next.`,
        });
        if (takeRight) {
          r.moveTo(j, i);
          r.snap({ moved: [i], range: [lo, hi], pointers: { left: i + 1 }, line: 6, note: `${a[i]} slides in front of the left half.` });
          j++;
        }
        i++;
      }
    };

    sort(0, a.length - 1);
    r.finish(DONE, 0);
    return r.steps;
  },
};

export const quickSort: Algorithm = {
  id: 'quick-sort',
  name: 'Quick sort',
  group: 'Sorting',
  summary:
    'Pick a pivot, move everything smaller to its left and everything larger to its right, then sort each side the same way. The pivot lands in its final position.',
  complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)' },
  stable: false,
  howItWorks: [
    'This version uses the last value of the section as the pivot.',
    'Walk through the section, swapping every value smaller than the pivot towards the front.',
    'Put the pivot just after those smaller values. It is now in its final position.',
    'The worst case happens when the pivot is always the smallest or largest value, for example on sorted input.',
  ],
  pseudocode: [
    'quickSort(lo, hi):',
    '  if lo ≥ hi: return',
    '  pivot ← a[hi],  i ← lo',
    '  for j from lo to hi − 1:',
    '    if a[j] < pivot: swap a[i] and a[j],  i ← i + 1',
    '  swap a[i] and a[hi]   (the pivot is now final)',
    '  quickSort(lo, i − 1)  and  quickSort(i + 1, hi)',
  ],
  run(values) {
    const r = createRecorder(values);
    const { a } = r;

    const sort = (lo: number, hi: number) => {
      if (lo > hi) return;
      if (lo === hi) {
        r.sorted.add(lo);
        r.snap({ range: [lo, hi], line: 1, note: `Position ${lo} is a section of one value, so ${a[lo]} is final.` });
        return;
      }
      const pivot = a[hi];
      let i = lo;
      r.snap({ range: [lo, hi], pivot: hi, pointers: { i }, line: 2, note: `Sort positions ${lo} to ${hi}. The pivot is ${pivot}.` });
      for (let j = lo; j < hi; j++) {
        r.countComparison();
        const smaller = a[j] < pivot;
        r.snap({
          compare: [j],
          range: [lo, hi],
          pivot: hi,
          pointers: { i, j },
          line: 4,
          note: smaller ? `${a[j]} is smaller than the pivot ${pivot}, so it belongs on the left.` : `${a[j]} is not smaller than the pivot ${pivot}, so it stays.`,
        });
        if (smaller) {
          if (i !== j) {
            r.swap(i, j);
            r.snap({ moved: [i, j], range: [lo, hi], pivot: hi, pointers: { i, j }, line: 4, note: `Swap ${a[i]} into position ${i}.` });
          }
          i++;
        }
      }
      if (i !== hi) r.swap(i, hi);
      r.sorted.add(i);
      r.snap({ moved: [i], range: [lo, hi], pointers: { i }, line: 5, note: `Put the pivot ${pivot} at position ${i}. Smaller values are on its left, the rest on its right.` });
      sort(lo, i - 1);
      sort(i + 1, hi);
    };

    sort(0, a.length - 1);
    r.finish(DONE, 0);
    return r.steps;
  },
};

/** Moves a[i] down the heap until neither child is larger. Only positions below `size` are in the heap. */
function siftDown(r: Recorder, start: number, size: number) {
  const { a } = r;
  let i = start;
  for (;;) {
    const left = 2 * i + 1;
    const right = left + 1;
    if (left >= size) return;
    let child = left;
    if (right < size) {
      r.countComparison();
      if (a[right] > a[left]) child = right;
      r.snap({ compare: [left, right], range: [0, size - 1], pointers: { parent: i }, line: 5, note: `The children of ${a[i]} are ${a[left]} and ${a[right]}. The larger is ${a[child]}.` });
    }
    r.countComparison();
    const childLarger = a[child] > a[i];
    r.snap({
      compare: [i, child],
      range: [0, size - 1],
      pointers: { parent: i, child },
      line: 5,
      note: childLarger ? `The child ${a[child]} is larger than its parent ${a[i]}, so they swap.` : `The parent ${a[i]} is not smaller than its child ${a[child]}, so it stays.`,
    });
    if (!childLarger) return;
    r.swap(i, child);
    r.snap({ moved: [i, child], range: [0, size - 1], pointers: { parent: child }, line: 5, note: `${a[i]} moves up and ${a[child]} moves down.` });
    i = child;
  }
}

export const heapSort: Algorithm = {
  id: 'heap-sort',
  name: 'Heap sort',
  group: 'Sorting',
  summary:
    'Arrange the array as a max-heap, where every parent is at least as large as its children. Then repeatedly move the largest value, at the front, to the end.',
  complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)' },
  stable: false,
  howItWorks: [
    'The array is read as a tree: the children of position i are at 2i + 1 and 2i + 2.',
    'Build a max-heap by sifting down every parent, starting from the last one.',
    'The largest value is now at position 0. Swap it with the last heap position, which becomes final.',
    'Sift the new front value down to repair the heap, and repeat with a heap one smaller.',
  ],
  pseudocode: [
    'build a max-heap:',
    '  for i from n / 2 − 1 down to 0: siftDown(i)',
    'for end from n − 1 down to 1:',
    '  swap a[0] and a[end]   (the largest goes to the end)',
    '  siftDown(0) inside a[0 .. end − 1]',
    'siftDown(i): swap a[i] with its larger child while that child is larger',
  ],
  run(values) {
    const r = createRecorder(values);
    const { a } = r;
    const n = a.length;
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      r.snap({ pointers: { i }, line: 1, note: `Build the heap: sift ${a[i]} at position ${i} down.` });
      siftDown(r, i, n);
    }
    for (let end = n - 1; end >= 1; end--) {
      r.swap(0, end);
      r.sorted.add(end);
      r.snap({ moved: [0, end], range: [0, end - 1], pointers: { end }, line: 3, note: `${a[end]} is the largest value in the heap. Swap it to position ${end}, which is now final.` });
      siftDown(r, 0, end);
    }
    r.finish(DONE, 2);
    return r.steps;
  },
};

export const sorts: Algorithm[] = [bubbleSort, selectionSort, insertionSort, mergeSort, quickSort, heapSort];
