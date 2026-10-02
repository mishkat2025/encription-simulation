import type { Cipher, GridStep } from './types';
import { inputCase, lettersOnly, outputCase, parseIntKey } from './util';

/** Which rail (row) the letter at position i sits on when writing in a zigzag. */
export function railOf(i: number, rails: number): number {
  const period = 2 * (rails - 1);
  const k = i % period;
  return k < rails ? k : period - k;
}

export const railFence: Cipher = {
  id: 'rail-fence',
  name: 'Rail fence cipher',
  aka: 'Keyless transposition (zigzag)',
  group: 'Transposition',
  summary:
    'The letters are not replaced, only moved. The message is written in a zigzag across two or more rows, then read off one row at a time.',
  howItWorks: [
    'Write the message in a zigzag: down to the last rail, back up to the first, and so on.',
    'Read the rails one after another, left to right, to get the ciphertext.',
    'To decrypt, mark the same zigzag, fill it rail by rail with the ciphertext, then read along the zigzag.',
    'The lecture treats it as keyless: with two rails there is nothing secret except the method.',
  ],
  params: [{ id: 'rails', label: 'Number of rails', kind: 'select', default: '2', options: ['2', '3', '4', '5'] }],
  examples: [
    { label: 'Example 3.22: "Meet me at the park"', text: 'Meet me at the park', key: { rails: '2' }, mode: 'encrypt' },
    { label: 'Decrypt "MEMATEAKETETHPR"', text: 'MEMATEAKETETHPR', key: { rails: '2' }, mode: 'decrypt' },
    { label: 'Three rails', text: 'Meet me at the park', key: { rails: '3' }, mode: 'encrypt' },
  ],
  attacks: [],

  run(text, key, mode) {
    const rails = parseIntKey(key.rails, 'The number of rails', 2, 5);
    const letters = lettersOnly(text);
    const n = letters.length;

    // The zigzag cells in the order the plaintext visits them, and in reading order (rail by rail).
    const zigzag = Array.from({ length: n }, (_, i) => ({ r: railOf(i, rails), c: i }));
    const byRail = [...zigzag].sort((a, b) => a.r - b.r || a.c - b.c);

    const writeOrder = mode === 'encrypt' ? zigzag : byRail;
    const readOrder = mode === 'encrypt' ? byRail : zigzag;

    const steps: GridStep[] = [];
    const cellLetter = new Map<string, string>();
    writeOrder.forEach((cell, i) => {
      cellLetter.set(`${cell.r},${cell.c}`, letters[i]);
      steps.push({ phase: 'write', ...cell, ch: inputCase(letters[i], mode), out: '' });
    });
    let out = '';
    for (const cell of readOrder) {
      const ch = outputCase(cellLetter.get(`${cell.r},${cell.c}`)!, mode);
      out += ch;
      steps.push({ phase: 'read', ...cell, ch, out });
    }

    return {
      view: 'grid',
      output: out,
      rows: rails,
      cols: n,
      slots: zigzag,
      steps,
      writeCaption:
        mode === 'encrypt'
          ? 'Write the plaintext in a zigzag across the rails.'
          : 'Fill the zigzag with the ciphertext, one rail at a time.',
      readCaption:
        mode === 'encrypt' ? 'Read the rails one after another, left to right.' : 'Read along the zigzag.',
      rowLabels: Array.from({ length: rails }, (_, r) => `Rail ${r + 1}`),
    };
  },
};
