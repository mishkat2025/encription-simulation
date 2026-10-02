import type { Cipher, StripStep } from './types';
import { lettersOnly, mod, num, parseIntKey, shiftMapping, stripStep, two } from './util';

export const SAMPLE_MESSAGE =
  'meet me behind the old library after the lecture ends and bring the notes from last week because the exam covers every chapter we studied this term';

export const additive: Cipher = {
  id: 'additive',
  name: 'Additive cipher',
  aka: 'Shift cipher, Caesar cipher',
  group: 'Monoalphabetic substitution',
  category: 'Stream cipher',
  summary:
    'Every letter is moved the same number of places along the alphabet. The key is that number, from 0 to 25. Julius Caesar used a key of 3.',
  formula: { encrypt: 'C = (P + k) mod 26', decrypt: 'P = (C − k) mod 26' },
  howItWorks: [
    'Turn each letter into a number: a = 0, b = 1, up to z = 25.',
    'To encrypt, add the key and wrap around past 25 (that is the "mod 26").',
    'To decrypt, subtract the same key.',
    'There are only 26 possible keys, so an attacker can simply try them all.',
  ],
  params: [{ id: 'k', label: 'Key (k)', kind: 'number', default: '15', min: 0, max: 25 }],
  examples: [
    { label: 'Example 3.3: encrypt "hello", key 15', text: 'hello', key: { k: '15' }, mode: 'encrypt' },
    { label: 'Example 3.4: decrypt "WTAAD", key 15', text: 'WTAAD', key: { k: '15' }, mode: 'decrypt' },
    { label: "Caesar's key of 3", text: 'attack at dawn', key: { k: '3' }, mode: 'encrypt' },
  ],
  attacks: ['brute', 'frequency'],
  attackSample: { text: SAMPLE_MESSAGE, key: { k: '4' } },

  run(text, key, mode) {
    const k = parseIntKey(key.k, 'The key', 0, 25);
    const mapping = shiftMapping(k);
    const steps: StripStep[] = [];
    let out = '';
    for (const ch of lettersOnly(text)) {
      const n = num(ch);
      const result = mode === 'encrypt' ? mod(n + k, 26) : mod(n - k, 26);
      const sign = mode === 'encrypt' ? '+' : '−';
      const calc = `(${two(n)} ${sign} ${two(k)}) mod 26 = ${two(result)}`;
      const step = stripStep(mode, n, result, mapping, calc, out, { keyNum: k });
      steps.push(step);
      out = step.out;
    }
    return { view: 'strip', output: out, steps, showNumbers: true, keyStream: 'none' };
  },
};
