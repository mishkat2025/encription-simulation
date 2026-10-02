import type { Cipher, StripStep } from './types';
import { KeyError, lettersOnly, mod, num, shiftMapping, stripStep, two } from './util';

export const vigenere: Cipher = {
  id: 'vigenere',
  name: 'Vigenère cipher',
  group: 'Polyalphabetic substitution',
  category: 'Stream cipher',
  summary:
    'A keyword is repeated along the message, and each letter is shifted by the keyword letter above it. It is several additive ciphers taking turns.',
  formula: { encrypt: 'Cᵢ = (Pᵢ + kᵢ) mod 26', decrypt: 'Pᵢ = (Cᵢ − kᵢ) mod 26' },
  howItWorks: [
    'Turn the keyword into numbers. PASCAL becomes 15, 0, 18, 2, 0, 11.',
    'Repeat those numbers as many times as needed to cover the message. That is the key stream.',
    'To encrypt, add each key value to its plaintext letter, mod 26. To decrypt, subtract.',
    'The key stream does not depend on the plaintext, unlike the autokey cipher.',
  ],
  params: [
    { id: 'keyword', label: 'Keyword', kind: 'text', default: 'PASCAL', placeholder: 'letters only' },
  ],
  examples: [
    {
      label: 'Example 3.16: "She is listening", keyword PASCAL',
      text: 'She is listening',
      key: { keyword: 'PASCAL' },
      mode: 'encrypt',
    },
    {
      label: 'Decrypt "HHWKSWXSLGNTCG", keyword PASCAL',
      text: 'HHWKSWXSLGNTCG',
      key: { keyword: 'PASCAL' },
      mode: 'decrypt',
    },
  ],
  attacks: [],

  run(text, key, mode) {
    const keyword = lettersOnly(key.keyword ?? '');
    if (keyword.length === 0) throw new KeyError('Enter a keyword with at least one letter.');
    const steps: StripStep[] = [];
    let out = '';
    lettersOnly(text).split('').forEach((ch, i) => {
      const n = num(ch);
      const keyChar = keyword[i % keyword.length];
      const k = num(keyChar);
      const result = mode === 'encrypt' ? mod(n + k, 26) : mod(n - k, 26);
      const sign = mode === 'encrypt' ? '+' : '−';
      const calc = `(${two(n)} ${sign} ${two(k)}) mod 26 = ${two(result)}`;
      const step = stripStep(mode, n, result, shiftMapping(k), calc, out, {
        keyNum: k,
        keyChar: keyChar.toUpperCase(),
      });
      steps.push(step);
      out = step.out;
    });
    return { view: 'strip', output: out, steps, showNumbers: true, keyStream: 'upfront' };
  },
};
