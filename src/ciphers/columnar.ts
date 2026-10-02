import type { Cipher, GridStep } from './types';
import { inputCase, lettersOnly, outputCase, parseIntKey } from './util';

export const columnar: Cipher = {
  id: 'columnar',
  name: 'Columnar transposition',
  aka: 'Keyless transposition (table)',
  group: 'Transposition',
  summary:
    'The message is written row by row into a table with an agreed number of columns, then read off column by column.',
  howItWorks: [
    'Alice and Bob agree on the number of columns.',
    'Write the plaintext into the table row by row.',
    'Read the table column by column to get the ciphertext.',
    'To decrypt, fill the same table column by column with the ciphertext, then read it row by row.',
  ],
  params: [
    {
      id: 'cols',
      label: 'Number of columns',
      kind: 'select',
      default: '4',
      options: ['2', '3', '4', '5', '6', '7', '8'],
    },
  ],
  examples: [
    {
      label: 'Slide example: "Meet me at the park", 4 columns',
      text: 'Meet me at the park',
      key: { cols: '4' },
      mode: 'encrypt',
    },
    { label: 'Decrypt "MMTAEEHREAEKTTP", 4 columns', text: 'MMTAEEHREAEKTTP', key: { cols: '4' }, mode: 'decrypt' },
  ],
  attacks: [],

  run(text, key, mode) {
    const cols = parseIntKey(key.cols, 'The number of columns', 2, 8);
    const letters = lettersOnly(text);
    const n = letters.length;
    const rows = Math.ceil(n / cols);

    // The filled cells in row order and in column order. The last row may be short.
    const byRow = Array.from({ length: n }, (_, i) => ({ r: Math.floor(i / cols), c: i % cols }));
    const byColumn = [...byRow].sort((a, b) => a.c - b.c || a.r - b.r);

    const writeOrder = mode === 'encrypt' ? byRow : byColumn;
    const readOrder = mode === 'encrypt' ? byColumn : byRow;

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
      rows,
      cols: Math.min(cols, Math.max(n, 1)),
      slots: byRow,
      steps,
      writeCaption:
        mode === 'encrypt'
          ? 'Write the plaintext into the table, row by row.'
          : 'Fill the table with the ciphertext, column by column.',
      readCaption: mode === 'encrypt' ? 'Read the table column by column.' : 'Read the table row by row.',
    };
  },
};
