// The two attacks from the lecture: brute force and the statistical
// (letter-frequency) attack. Both are ciphertext-only attacks: Eve needs
// nothing but the intercepted message.

import { findCipher } from '../ciphers';
import type { KeyValues } from '../ciphers/types';
import { Z26_STAR, lettersOnly, mod, num } from '../ciphers/util';

/** How often each letter a-z appears in typical English text, in percent. */
export const ENGLISH_FREQUENCY = [
  8.167, 1.492, 2.782, 4.253, 12.702, 2.228, 2.015, 6.094, 6.966, 0.153, 0.772, 4.025, 2.406, 6.749, 7.507, 1.929,
  0.095, 5.987, 6.327, 9.056, 2.758, 0.978, 2.36, 0.15, 1.974, 0.074,
];

/** How many times each letter a-z appears in the text. */
export function letterCounts(text: string): number[] {
  const counts = new Array<number>(26).fill(0);
  for (const ch of lettersOnly(text)) counts[num(ch)]++;
  return counts;
}

/**
 * Chi-squared distance between the text's letter frequencies and English.
 * Lower means the text looks more like English.
 */
export function englishScore(text: string): number {
  const counts = letterCounts(text);
  const total = counts.reduce((sum, count) => sum + count, 0);
  if (total === 0) return Infinity;
  return counts.reduce((sum, count, i) => {
    const expected = (ENGLISH_FREQUENCY[i] / 100) * total;
    return sum + (count - expected) ** 2 / expected;
  }, 0);
}

export interface Candidate {
  keyLabel: string;
  key: KeyValues;
  plaintext: string;
  score: number;
}

export type BruteForceTarget = 'additive' | 'multiplicative' | 'affine';

/** Every key the cipher allows. Small enough to try them all, which is the point. */
function allKeys(cipherId: BruteForceTarget): { keyLabel: string; key: KeyValues }[] {
  if (cipherId === 'additive') {
    return Array.from({ length: 25 }, (_, i) => ({ keyLabel: String(i + 1), key: { k: String(i + 1) } }));
  }
  if (cipherId === 'multiplicative') {
    return Z26_STAR.map((k) => ({ keyLabel: String(k), key: { k: String(k) } }));
  }
  return Z26_STAR.flatMap((k1) =>
    Array.from({ length: 26 }, (_, k2) => ({
      keyLabel: `(${k1}, ${k2})`,
      key: { k1: String(k1), k2: String(k2) },
    })),
  );
}

/** Decrypts the ciphertext with every possible key and scores each result. */
export function bruteForce(cipherId: BruteForceTarget, ciphertext: string): Candidate[] {
  const cipher = findCipher(cipherId)!;
  return allKeys(cipherId).map(({ keyLabel, key }) => {
    const plaintext = cipher.run(ciphertext, key, 'decrypt').output;
    return { keyLabel, key, plaintext, score: englishScore(plaintext) };
  });
}

/** The candidate whose decryption looks most like English. */
export function bestCandidate(candidates: Candidate[]): Candidate | undefined {
  return candidates.reduce<Candidate | undefined>(
    (best, candidate) => (best === undefined || candidate.score < best.score ? candidate : best),
    undefined,
  );
}

export interface AdditiveGuess {
  /** Index (0-25) of the most common ciphertext letter. */
  topLetter: number;
  topCount: number;
  /** The key if that letter stands for e: the lecture's method. */
  keyFromE: number;
  /** The key whose decryption fits English best across all 26 letters. */
  bestFitKey: number;
}

/** The statistical attack on an additive cipher: assume the most common letter is e. */
export function guessAdditiveKey(ciphertext: string): AdditiveGuess | undefined {
  const counts = letterCounts(ciphertext);
  const topCount = Math.max(...counts);
  if (topCount === 0) return undefined;
  const topLetter = counts.indexOf(topCount);
  const best = bestCandidate(bruteForce('additive', ciphertext));
  const bestFitKey = best && englishScore(ciphertext) > best.score ? Number(best.keyLabel) : 0;
  return { topLetter, topCount, keyFromE: mod(topLetter - 4, 26), bestFitKey };
}
