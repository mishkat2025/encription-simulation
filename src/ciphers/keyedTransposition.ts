import type { Cipher, PermStep } from './types';
import { KeyError, inputCase, lettersOnly, outputCase } from './util';

/** Reads a key such as "3 1 4 5 2" (or "31452") and checks it is a permutation of 1..n. */
export function parsePermutationKey(value: string | undefined): number[] {
  const tokens = (value ?? '').match(/\d+/g) ?? [];
  // "31452" typed without spaces means five single digits.
  const parts = tokens.length === 1 && tokens[0].length > 1 ? tokens[0].split('') : tokens;
  const key = parts.map(Number);
  const n = key.length;
  if (n < 2) throw new KeyError('Enter at least two numbers, for example 3 1 4 5 2.');
  for (let want = 1; want <= n; want++) {
    if (!key.includes(want)) {
      throw new KeyError(`A key of length ${n} must use each number from 1 to ${n} exactly once. ${want} is missing.`);
    }
  }
  return key;
}

/** The decryption key undoes the encryption key: if position 3 moved to 1, then 1 moves back to 3. */
export function invertKey(key: number[]): number[] {
  const inverse = new Array<number>(key.length);
  key.forEach((from, to) => {
    inverse[from - 1] = to + 1;
  });
  return inverse;
}

export const keyedTransposition: Cipher = {
  id: 'keyed-transposition',
  name: 'Keyed transposition cipher',
  aka: 'Permutation cipher',
  group: 'Transposition',
  category: 'Block cipher',
  summary:
    'The message is cut into blocks of a fixed size, and the letters inside every block are shuffled in the same way. The key is the shuffle.',
  howItWorks: [
    'The key lists, for each ciphertext position, which plaintext position to take. With 3 1 4 5 2, the first ciphertext letter is the third plaintext letter.',
    'Cut the plaintext into blocks as long as the key. Fill the last block with the bogus letter z if it is short.',
    'Apply the same key to every block.',
    'To decrypt, use the inverse key, which sends every letter back where it came from.',
  ],
  params: [
    {
      id: 'key',
      label: 'Permutation key',
      kind: 'text',
      default: '3 1 4 5 2',
      placeholder: 'e.g. 3 1 4 5 2',
      help: 'Each number from 1 to n, used once.',
    },
  ],
  examples: [
    {
      label: 'Slide example: "Enemy attacks tonight", key 3 1 4 5 2',
      text: 'Enemy attacks tonight',
      key: { key: '3 1 4 5 2' },
      mode: 'encrypt',
    },
    {
      label: 'Decrypt "EEMYNTAACTTKONSHITZG", key 3 1 4 5 2',
      text: 'EEMYNTAACTTKONSHITZG',
      key: { key: '3 1 4 5 2' },
      mode: 'decrypt',
    },
  ],
  attacks: [],

  run(text, key, mode) {
    const encKey = parsePermutationKey(key.key);
    const decKey = invertKey(encKey);
    const size = encKey.length;
    // output[j] = input[perm[j]] in both directions; only the key differs.
    const perm = (mode === 'encrypt' ? encKey : decKey).map((position) => position - 1);

    let letters = lettersOnly(text);
    let padding = 0;
    if (letters.length % size !== 0) {
      if (mode === 'decrypt') {
        throw new KeyError(
          `The ciphertext must split into blocks of ${size} letters, but it has ${letters.length} letters.`,
        );
      }
      padding = size - (letters.length % size);
      letters += 'z'.repeat(padding);
    }

    const blocks: { input: string; output: string }[] = [];
    const steps: PermStep[] = [];
    let out = '';
    for (let start = 0; start < letters.length; start += size) {
      const input = letters.slice(start, start + size);
      let output = '';
      perm.forEach((from, to) => {
        const ch = outputCase(input[from], mode);
        output += ch;
        out += ch;
        steps.push({ block: blocks.length, to, from, ch, out });
      });
      blocks.push({ input: inputCase(input, mode), output });
    }

    return { view: 'permutation', output: out, size, perm, encKey, decKey, blocks, steps, padding };
  },
};
