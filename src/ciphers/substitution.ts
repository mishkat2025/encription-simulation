import type { Cipher, StripStep } from './types';
import { SAMPLE_MESSAGE } from './additive';
import { ALPHABET, KeyError, lettersOnly, num, stripStep } from './util';

const LECTURE_KEY = 'NOATRBECFUXDQGYLKHVIJMPZSW';

/** Checks that the key is the 26 letters of the alphabet, each used once. */
export function parseSubstitutionKey(value: string | undefined): string {
  const key = lettersOnly(value ?? '').toUpperCase();
  if (key.length !== 26) {
    throw new KeyError(`The key must have exactly 26 letters. It has ${key.length}.`);
  }
  const missing = [...ALPHABET.toUpperCase()].filter((ch) => !key.includes(ch));
  if (missing.length > 0) {
    throw new KeyError(`Every letter must appear exactly once. Missing: ${missing.join(', ')}.`);
  }
  return key;
}

export const substitution: Cipher = {
  id: 'substitution',
  name: 'Monoalphabetic substitution cipher',
  group: 'Monoalphabetic substitution',
  category: 'Stream cipher',
  summary:
    'Alice and Bob agree on a table that maps each plaintext letter to a ciphertext letter. The key is the whole table, so there are 26! possible keys, far too many to try one by one.',
  howItWorks: [
    'The key is the alphabet in a scrambled order, written under the normal alphabet.',
    'To encrypt, find the letter in the top row and take the letter under it.',
    'To decrypt, find the letter in the bottom row and take the letter above it.',
    'Brute force is hopeless, but the cipher still leaks letter frequencies: the most common ciphertext letter probably stands for e.',
  ],
  params: [
    {
      id: 'table',
      label: 'Key table (ciphertext alphabet for a to z)',
      kind: 'text',
      default: LECTURE_KEY,
      placeholder: '26 letters, each used once',
      randomAlphabet: true,
    },
  ],
  examples: [
    {
      label: 'Example 3.13: the key from Figure 3.12',
      text: 'this message is easy to encrypt but hard to find the key',
      key: { table: LECTURE_KEY },
      mode: 'encrypt',
    },
  ],
  attacks: ['frequency'],
  attackSample: { text: SAMPLE_MESSAGE, key: { table: LECTURE_KEY } },

  run(text, key, mode) {
    const table = parseSubstitutionKey(key.table);
    const steps: StripStep[] = [];
    let out = '';
    for (const ch of lettersOnly(text)) {
      const n = num(ch);
      const result = mode === 'encrypt' ? num(table[n]) : table.indexOf(ch.toUpperCase());
      const calc =
        mode === 'encrypt'
          ? `find ${ch} in the top row, read the letter below`
          : `find ${ch.toUpperCase()} in the bottom row, read the letter above`;
      const step = stripStep(mode, n, result, table, calc, out);
      steps.push(step);
      out = step.out;
    }
    return { view: 'strip', output: out, steps, showNumbers: false, keyStream: 'none' };
  },
};
