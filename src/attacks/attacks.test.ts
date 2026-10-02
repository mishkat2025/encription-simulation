import { describe, expect, it } from 'vitest';
import { bestCandidate, bruteForce, guessAdditiveKey, letterCounts } from './attacks';
import { findCipher } from '../ciphers';
import { SAMPLE_MESSAGE } from '../ciphers/additive';
import { lettersOnly } from '../ciphers/util';

describe('brute-force attack', () => {
  it('Example 3.5: finds key 7 for UVACLYFZLJBYL', () => {
    const candidates = bruteForce('additive', 'UVACLYFZLJBYL');
    expect(candidates).toHaveLength(25);
    const best = bestCandidate(candidates)!;
    expect(best.keyLabel).toBe('7');
    expect(best.plaintext).toBe('notverysecure');
  });

  it('tries all 12 multiplicative keys and all 312 affine keys', () => {
    expect(bruteForce('multiplicative', 'XCZZU')).toHaveLength(12);
    expect(bruteForce('affine', 'ZEBBW')).toHaveLength(312);
  });

  it('recovers the affine key (7, 2) from a longer message', () => {
    const ciphertext = findCipher('affine')!.run(SAMPLE_MESSAGE, { k1: '7', k2: '2' }, 'encrypt').output;
    const best = bestCandidate(bruteForce('affine', ciphertext))!;
    expect(best.keyLabel).toBe('(7, 2)');
    expect(best.plaintext).toBe(lettersOnly(SAMPLE_MESSAGE));
  });
});

describe('statistical attack', () => {
  it('counts letters', () => {
    const counts = letterCounts('Hello, world');
    expect(counts[11]).toBe(3); // l
    expect(counts[14]).toBe(2); // o
  });

  it('finds the additive key by assuming the most common letter is e', () => {
    const ciphertext = findCipher('additive')!.run(SAMPLE_MESSAGE, { k: '4' }, 'encrypt').output;
    const guess = guessAdditiveKey(ciphertext)!;
    expect(guess.topLetter).toBe(8); // I, which is e shifted by 4
    expect(guess.keyFromE).toBe(4);
    expect(guess.bestFitKey).toBe(4);
  });
});
