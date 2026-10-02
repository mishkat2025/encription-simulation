import type { Cipher, StripStep } from './types';
import { SAMPLE_MESSAGE } from './additive';
import {
  Z26_STAR,
  letter,
  lettersOnly,
  mod,
  modInverse,
  num,
  parseIntKey,
  parseZ26StarKey,
  stripStep,
  two,
} from './util';

export const affine: Cipher = {
  id: 'affine',
  name: 'Affine cipher',
  group: 'Monoalphabetic substitution',
  category: 'Stream cipher',
  summary:
    'A multiplicative cipher followed by an additive cipher. The key is a pair: k₁ multiplies and k₂ adds. That gives 12 × 26 = 312 possible keys.',
  formula: { encrypt: 'C = (P × k₁ + k₂) mod 26', decrypt: 'P = ((C − k₂) × k₁⁻¹) mod 26' },
  howItWorks: [
    'To encrypt, multiply the letter by k₁, then add k₂, and reduce mod 26.',
    'To decrypt, undo the steps in reverse order: subtract k₂, then multiply by the inverse of k₁.',
    'k₁ must be in Z26* so that it has an inverse. k₂ can be anything from 0 to 25.',
    'With k₁ = 1 this is the additive cipher. With k₂ = 0 it is the multiplicative cipher.',
  ],
  params: [
    { id: 'k1', label: 'k₁ (multiply)', kind: 'select', default: '7', options: Z26_STAR.map(String) },
    { id: 'k2', label: 'k₂ (add)', kind: 'number', default: '2', min: 0, max: 25 },
  ],
  examples: [
    {
      label: 'Example 3.10: encrypt "hello", key (7, 2)',
      text: 'hello',
      key: { k1: '7', k2: '2' },
      mode: 'encrypt',
    },
    {
      label: 'Example 3.11: decrypt "ZEBBW", key (7, 2)',
      text: 'ZEBBW',
      key: { k1: '7', k2: '2' },
      mode: 'decrypt',
    },
  ],
  attacks: ['brute'],
  attackSample: { text: SAMPLE_MESSAGE, key: { k1: '7', k2: '2' } },

  run(text, key, mode) {
    const k1 = parseZ26StarKey(key.k1, 'k₁');
    const k2 = parseIntKey(key.k2, 'k₂', 0, 25);
    const inverse = modInverse(k1, 26)!;
    const mapping = Array.from({ length: 26 }, (_, p) => letter(p * k1 + k2).toUpperCase()).join('');
    const steps: StripStep[] = [];
    let out = '';
    for (const ch of lettersOnly(text)) {
      const n = num(ch);
      let result: number;
      let calc: string;
      if (mode === 'encrypt') {
        result = mod(n * k1 + k2, 26);
        calc = `(${two(n)} × ${two(k1)} + ${two(k2)}) mod 26 = ${two(result)}`;
      } else {
        result = mod((n - k2) * inverse, 26);
        calc = `((${two(n)} − ${two(k2)}) × ${two(inverse)}) mod 26 = ${two(result)}`;
      }
      const step = stripStep(mode, n, result, mapping, calc, out);
      steps.push(step);
      out = step.out;
    }
    return { view: 'strip', output: out, steps, showNumbers: true, keyStream: 'none' };
  },
};
