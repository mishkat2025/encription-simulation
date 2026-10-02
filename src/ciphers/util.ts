import type { Mode, StripStep } from './types';

export const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

/** The members of Z26*: the numbers below 26 that have a multiplicative inverse. */
export const Z26_STAR = [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25];

/** Thrown for a bad key or message. The UI shows the message to the user. */
export class KeyError extends Error {}

/** Modulo that never returns a negative number, unlike JavaScript's % operator. */
export const mod = (n: number, m: number) => ((n % m) + m) % m;

export function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

/** Multiplicative inverse of a modulo m, or null when there is none. */
export function modInverse(a: number, m: number): number | null {
  for (let x = 1; x < m; x++) {
    if (mod(a * x, m) === 1) return x;
  }
  return null;
}

/** Keeps only the letters a-z, lowercased. Spaces and punctuation are dropped, as in the lecture. */
export const lettersOnly = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

/** a → 0, b → 1, ... z → 25 */
export const num = (ch: string) => ch.toLowerCase().charCodeAt(0) - 97;

/** 0 → a, 1 → b, ... 25 → z (wraps around) */
export const letter = (n: number) => ALPHABET[mod(n, 26)];

/** Two-digit form used in the lecture's worked examples: 7 → "07". */
export const two = (n: number) => String(n).padStart(2, '0');

/** Plaintext is written in lowercase and ciphertext in uppercase, as in the lecture. */
export const inputCase = (s: string, mode: Mode) => (mode === 'encrypt' ? s.toLowerCase() : s.toUpperCase());
export const outputCase = (s: string, mode: Mode) => (mode === 'encrypt' ? s.toUpperCase() : s.toLowerCase());

export function parseIntKey(value: string | undefined, label: string, min: number, max: number): number {
  const n = Number(value);
  if (value === undefined || value.trim() === '' || !Number.isInteger(n)) {
    throw new KeyError(`${label} must be a whole number.`);
  }
  if (n < min || n > max) {
    throw new KeyError(`${label} must be between ${min} and ${max}.`);
  }
  return n;
}

export function parseZ26StarKey(value: string | undefined, label: string): number {
  const n = parseIntKey(value, label, 1, 25);
  if (gcd(n, 26) !== 1) {
    throw new KeyError(
      `${label} must be in Z26* (${Z26_STAR.join(', ')}). ${n} shares a factor with 26, so it has no inverse and the message could not be decrypted.`,
    );
  }
  return n;
}

/** The cipher alphabet produced by shifting every letter forward by k. */
export const shiftMapping = (k: number) =>
  Array.from({ length: 26 }, (_, p) => letter(p + k).toUpperCase()).join('');

/** Builds one step for the strip view from the input number and the computed output number. */
export function stripStep(
  mode: Mode,
  inNum: number,
  outNum: number,
  mapping: string,
  calc: string,
  previousOut: string,
  key: { keyNum?: number; keyChar?: string } = {},
): StripStep {
  const outChar = outputCase(letter(outNum), mode);
  return {
    inChar: inputCase(letter(inNum), mode),
    outChar,
    inNum,
    outNum,
    plainIndex: mode === 'encrypt' ? inNum : outNum,
    mapping,
    calc,
    out: previousOut + outChar,
    ...key,
  };
}
