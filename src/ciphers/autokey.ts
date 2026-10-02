import type { Cipher, StripStep } from './types';
import { letter, lettersOnly, mod, num, parseIntKey, shiftMapping, stripStep, two } from './util';

export const autokey: Cipher = {
  id: 'autokey',
  name: 'Autokey cipher',
  group: 'Polyalphabetic substitution',
  category: 'Stream cipher',
  summary:
    'An additive cipher whose key changes for every letter. The first key is agreed in advance; after that, each plaintext letter becomes the key for the next one.',
  formula: { encrypt: 'Cᵢ = (Pᵢ + kᵢ) mod 26', decrypt: 'Pᵢ = (Cᵢ − kᵢ) mod 26' },
  howItWorks: [
    'The key stream is k₁, P₁, P₂, P₃ and so on: the agreed first key, followed by the plaintext itself.',
    'To encrypt, add each key value to its plaintext letter, mod 26.',
    'To decrypt, subtract. Each letter Bob recovers gives him the key for the next letter.',
    'The same plaintext letter can encrypt to different ciphertext letters, which hides single-letter frequencies.',
  ],
  params: [{ id: 'k1', label: 'First key (k₁)', kind: 'number', default: '12', min: 0, max: 25 }],
  examples: [
    {
      label: 'Example 3.14: "Attack is today", k₁ = 12',
      text: 'Attack is today',
      key: { k1: '12' },
      mode: 'encrypt',
    },
    { label: 'Decrypt "MTMTCMSALHRDY", k₁ = 12', text: 'MTMTCMSALHRDY', key: { k1: '12' }, mode: 'decrypt' },
  ],
  attacks: [],

  run(text, key, mode) {
    const k1 = parseIntKey(key.k1, 'The first key', 0, 25);
    const steps: StripStep[] = [];
    let out = '';
    let k = k1;
    lettersOnly(text).split('').forEach((ch, i) => {
      const n = num(ch);
      const result = mode === 'encrypt' ? mod(n + k, 26) : mod(n - k, 26);
      const sign = mode === 'encrypt' ? '+' : '−';
      const calc = `(${two(n)} ${sign} ${two(k)}) mod 26 = ${two(result)}`;
      const step = stripStep(mode, n, result, shiftMapping(k), calc, out, {
        keyNum: k,
        // The first key is just a number. Later keys are the previous plaintext letter.
        keyChar: i === 0 ? undefined : letter(k),
      });
      steps.push(step);
      out = step.out;
      // The next key is this step's plaintext letter.
      k = mode === 'encrypt' ? n : result;
    });
    return { view: 'strip', output: out, steps, showNumbers: true, keyStream: mode === 'encrypt' ? 'upfront' : 'revealed' };
  },
};
