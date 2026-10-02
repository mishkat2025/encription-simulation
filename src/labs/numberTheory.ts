// The number theory behind RSA and Diffie-Hellman. Like the ciphers, these
// functions return the steps they took, so the UI can show the working.
//
// Everything uses ordinary JavaScript numbers, which is exact as long as no
// intermediate value passes 2^53. With moduli below one million, the largest
// product is below 10^12, so that limit is never reached.

import { gcd, mod } from '../ciphers/util';

/** The largest prime or modulus the labs accept. */
export const MAX_MODULUS = 1_000_000;

/** Thrown for invalid input. The UI shows the message to the user. */
export class LabError extends Error {}

export function isPrime(n: number): boolean {
  if (!Number.isInteger(n) || n < 2) return false;
  for (let d = 2; d * d <= n; d++) {
    if (n % d === 0) return false;
  }
  return true;
}

/* ---------- extended Euclidean algorithm ---------- */

export interface EuclidRow {
  q: number;
  r1: number;
  r2: number;
  r: number;
  t1: number;
  t2: number;
  t: number;
}

export interface InverseTrace {
  rows: EuclidRow[];
  gcd: number;
  /** The inverse of b modulo n, or null when gcd(n, b) is not 1. */
  inverse: number | null;
  /** The final t1 before it is reduced mod n. It can be negative. */
  rawT: number;
}

/**
 * Finds the multiplicative inverse of b modulo n with the extended Euclidean
 * algorithm, keeping every row of the table (q, r1, r2, r, t1, t2, t).
 */
export function inverseTrace(n: number, b: number): InverseTrace {
  let r1 = n;
  let r2 = b;
  let t1 = 0;
  let t2 = 1;
  const rows: EuclidRow[] = [];
  while (r2 > 0) {
    const q = Math.floor(r1 / r2);
    const r = r1 - q * r2;
    const t = t1 - q * t2;
    rows.push({ q, r1, r2, r, t1, t2, t });
    r1 = r2;
    r2 = r;
    t1 = t2;
    t2 = t;
  }
  return { rows, gcd: r1, inverse: r1 === 1 ? mod(t1, n) : null, rawT: t1 };
}

/* ---------- fast modular exponentiation ---------- */

export interface PowRow {
  /** Bit position, starting from the least significant bit. */
  i: number;
  bit: 0 | 1;
  /** The running result after this bit: multiplied by `a` when the bit is 1. */
  y: number;
  /** The power of the base used for this bit: base^(2^i) mod n. */
  a: number;
  /** The same power, squared, ready for the next bit. */
  aNext: number;
}

export interface PowTrace {
  base: number;
  exponent: number;
  modulus: number;
  /** The exponent in binary, most significant bit first. */
  binary: string;
  rows: PowRow[];
  result: number;
}

/**
 * Computes base^exponent mod modulus with the square-and-multiply method.
 * It needs one row per bit of the exponent, not one multiplication per unit:
 * that is what makes RSA with a 2048-bit exponent possible at all.
 */
export function powTrace(base: number, exponent: number, modulus: number): PowTrace {
  let y = 1 % modulus;
  let a = mod(base, modulus);
  const rows: PowRow[] = [];
  const binary = exponent.toString(2);
  for (let i = 0; i < binary.length; i++) {
    const bit = binary[binary.length - 1 - i] === '1' ? 1 : 0;
    if (bit === 1) y = (y * a) % modulus;
    const aNext = (a * a) % modulus;
    rows.push({ i, bit, y, a, aNext });
    a = aNext;
  }
  return { base, exponent, modulus, binary, rows, result: y };
}

export const modPow = (base: number, exponent: number, modulus: number) => powTrace(base, exponent, modulus).result;

/* ---------- RSA ---------- */

export interface RsaKeys {
  p: number;
  q: number;
  n: number;
  phi: number;
  e: number;
  d: number;
  inverse: InverseTrace;
}

/** Every public exponent that works with this phi: 1 < e < phi and gcd(e, phi) = 1. */
export function validExponents(phi: number, limit = 40): number[] {
  const found: number[] = [];
  for (let e = 2; e < phi && found.length < limit; e++) {
    if (gcd(e, phi) === 1) found.push(e);
  }
  return found;
}

/** RSA key generation: n = p × q, phi = (p − 1)(q − 1), d = e⁻¹ mod phi. */
export function rsaKeys(p: number, q: number, e: number): RsaKeys {
  if (!isPrime(p)) throw new LabError(`p must be a prime number. ${p} is not prime.`);
  if (!isPrime(q)) throw new LabError(`q must be a prime number. ${q} is not prime.`);
  if (p === q) throw new LabError('p and q must be different primes.');
  const n = p * q;
  if (n > MAX_MODULUS) throw new LabError(`Keep p × q below ${MAX_MODULUS.toLocaleString()} so every step can be shown exactly.`);
  const phi = (p - 1) * (q - 1);
  if (!Number.isInteger(e) || e <= 1 || e >= phi) throw new LabError(`e must be between 2 and ${phi - 1}.`);
  const inverse = inverseTrace(phi, e);
  if (inverse.inverse === null) {
    throw new LabError(`e = ${e} shares a factor with φ(n) = ${phi}, so it has no inverse and no private key exists.`);
  }
  return { p, q, n, phi, e, d: inverse.inverse, inverse };
}

export interface FactorTrace {
  /** Each divisor Eve tried, in order. The last one divides n. */
  tried: number[];
  p: number;
  q: number;
}

/** Eve's attack on a small RSA modulus: divide by 2, 3, 4 ... until something fits. */
export function factorByTrialDivision(n: number): FactorTrace | null {
  const tried: number[] = [];
  for (let d = 2; d * d <= n; d++) {
    tried.push(d);
    if (n % d === 0) return { tried, p: d, q: n / d };
  }
  return null;
}

/* ---------- Diffie-Hellman ---------- */

export interface DiffieHellman {
  p: number;
  g: number;
  a: number;
  b: number;
  /** Alice's public value g^a mod p, and Bob's g^b mod p. */
  publicA: PowTrace;
  publicB: PowTrace;
  /** The shared key as each side computes it. They are always equal. */
  keyAlice: PowTrace;
  keyBob: PowTrace;
}

export function diffieHellman(p: number, g: number, a: number, b: number): DiffieHellman {
  if (!isPrime(p)) throw new LabError(`p must be a prime number. ${p} is not prime.`);
  if (p < 5) throw new LabError('Choose a prime of at least 5.');
  if (p > MAX_MODULUS) throw new LabError(`Keep p below ${MAX_MODULUS.toLocaleString()} so every step can be shown exactly.`);
  if (!Number.isInteger(g) || g < 2 || g > p - 2) throw new LabError(`g must be between 2 and ${p - 2}.`);
  for (const [name, value] of [['Alice', a], ['Bob', b]] as const) {
    if (!Number.isInteger(value) || value < 1 || value > p - 2) {
      throw new LabError(`${name}'s private number must be between 1 and ${p - 2}.`);
    }
  }
  const publicA = powTrace(g, a, p);
  const publicB = powTrace(g, b, p);
  return {
    p,
    g,
    a,
    b,
    publicA,
    publicB,
    keyAlice: powTrace(publicB.result, a, p),
    keyBob: powTrace(publicA.result, b, p),
  };
}

/** How many different values g^x mod p can take. For a primitive root this is p − 1. */
export function orderOf(g: number, p: number): number {
  let value = mod(g, p);
  let order = 1;
  while (value !== 1) {
    value = (value * g) % p;
    order++;
  }
  return order;
}

export interface DiscreteLogTrace {
  /** Each exponent Eve tried, with g^x mod p. The last one matches the target. */
  tried: { x: number; value: number }[];
  x: number;
}

/** Eve's attack on a small Diffie-Hellman exchange: try x = 1, 2, 3 ... until g^x mod p matches. */
export function discreteLogByTrial(g: number, target: number, p: number): DiscreteLogTrace | null {
  const tried: { x: number; value: number }[] = [];
  let value = 1;
  for (let x = 1; x < p; x++) {
    value = (value * g) % p;
    tried.push({ x, value });
    if (value === target) return { tried, x };
  }
  return null;
}
