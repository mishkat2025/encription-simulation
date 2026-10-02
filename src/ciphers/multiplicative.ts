import type { Cipher, StripStep } from './types';
import { SAMPLE_MESSAGE } from './additive';
import { Z26_STAR, letter, lettersOnly, mod, modInverse, num, parseZ26StarKey, stripStep, two } from './util';

export const multiplicative: Cipher = {
  id: 'multiplicative',
  name: 'Multiplicative cipher',
  group: 'Monoalphabetic substitution',
  category: 'Stream cipher',
  summary:
    'Every letter is multiplied by the key. Only 12 keys work, because the key needs a multiplicative inverse modulo 26 for decryption to be possible.',
  formula: { encrypt: 'C = (P × k) mod 26', decrypt: 'P = (C × k⁻¹) mod 26' },
  howItWorks: [
    'Turn each letter into a number: a = 0, b = 1, up to z = 25.',
    'To encrypt, multiply by the key and reduce mod 26.',
    'To decrypt, multiply by the inverse of the key, k⁻¹, the number where k × k⁻¹ mod 26 = 1.',
    `The key must be in Z26*: ${Z26_STAR.join(', ')}. Any other key maps two letters to the same ciphertext letter.`,
  ],
  params: [
    {
      id: 'k',
      label: 'Key (k)',
      kind: 'select',
      default: '7',
      options: Z26_STAR.map(String),
      help: 'Only members of Z26* are offered.',
    },
  ],
  examples: [
    { label: 'Example 3.8: encrypt "hello", key 7', text: 'hello', key: { k: '7' }, mode: 'encrypt' },
    { label: 'Decrypt "XCZZU", key 7', text: 'XCZZU', key: { k: '7' }, mode: 'decrypt' },
  ],
  attacks: ['brute'],
  attackSample: { text: SAMPLE_MESSAGE, key: { k: '7' } },

  run(text, key, mode) {
    const k = parseZ26StarKey(key.k, 'The key');
    const inverse = modInverse(k, 26)!;
    const mapping = Array.from({ length: 26 }, (_, p) => letter(p * k).toUpperCase()).join('');
    const steps: StripStep[] = [];
    let out = '';
    for (const ch of lettersOnly(text)) {
      const n = num(ch);
      const factor = mode === 'encrypt' ? k : inverse;
      const result = mod(n * factor, 26);
      const calc = `(${two(n)} × ${two(factor)}) mod 26 = ${two(result)}`;
      const step = stripStep(mode, n, result, mapping, calc, out, { keyNum: factor });
      steps.push(step);
      out = step.out;
    }
    return { view: 'strip', output: out, steps, showNumbers: true, keyStream: 'none' };
  },
};
