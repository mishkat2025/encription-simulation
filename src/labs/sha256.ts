// SHA-256, written out step by step so the UI can show what happens inside.
// It follows the standard (FIPS 180-4) and is checked against the official
// test vectors in labs.test.ts.
//
// Every value is a 32-bit word. JavaScript's bit operators work on signed
// 32-bit numbers, so ">>> 0" is used to turn results back into unsigned ones.

/** The first n prime numbers. */
function firstPrimes(n: number): number[] {
  const primes: number[] = [];
  for (let candidate = 2; primes.length < n; candidate++) {
    if (primes.every((prime) => candidate % prime !== 0)) primes.push(candidate);
  }
  return primes;
}

/** The first 32 bits after the decimal point of x. */
const fractionBits = (x: number) => Math.floor((x - Math.floor(x)) * 2 ** 32) >>> 0;

// The constants are not arbitrary: they are the fractional parts of the
// square roots (starting hash) and cube roots (round constants) of the first
// primes. Anyone can recompute them, which shows nothing was hidden in them.
export const INITIAL_HASH = firstPrimes(8).map((prime) => fractionBits(Math.sqrt(prime)));
export const ROUND_CONSTANTS = firstPrimes(64).map((prime) => fractionBits(Math.cbrt(prime)));

const rotateRight = (x: number, bits: number) => ((x >>> bits) | (x << (32 - bits))) >>> 0;
const add = (...words: number[]) => words.reduce((sum, word) => (sum + word) >>> 0, 0);

const choose = (e: number, f: number, g: number) => ((e & f) ^ (~e & g)) >>> 0;
const majority = (a: number, b: number, c: number) => ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
const bigSigma0 = (a: number) => (rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22)) >>> 0;
const bigSigma1 = (e: number) => (rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25)) >>> 0;
const smallSigma0 = (x: number) => (rotateRight(x, 7) ^ rotateRight(x, 18) ^ (x >>> 3)) >>> 0;
const smallSigma1 = (x: number) => (rotateRight(x, 17) ^ rotateRight(x, 19) ^ (x >>> 10)) >>> 0;

/** A word as eight hex digits. */
export const hex = (word: number) => word.toString(16).padStart(8, '0');

export interface PaddedMessage {
  bytes: Uint8Array;
  /** How many bytes are the message itself. After them: one 0x80 byte, zeros, then 8 length bytes. */
  messageLength: number;
}

/** Pads the message so its length is a multiple of 64 bytes (512 bits). */
export function pad(message: Uint8Array): PaddedMessage {
  const bitLength = message.length * 8;
  // Room for the message, the 0x80 marker and the 8-byte length, rounded up to a full block.
  const total = Math.ceil((message.length + 9) / 64) * 64;
  const bytes = new Uint8Array(total);
  bytes.set(message);
  bytes[message.length] = 0x80;
  const view = new DataView(bytes.buffer);
  view.setUint32(total - 8, Math.floor(bitLength / 2 ** 32));
  view.setUint32(total - 4, bitLength >>> 0);
  return { bytes, messageLength: message.length };
}

export interface RoundTrace {
  /** The message-schedule word and the constant mixed in this round. */
  w: number;
  k: number;
  t1: number;
  t2: number;
  /** The eight working variables a-h before and after the round. */
  before: number[];
  after: number[];
}

export interface BlockTrace {
  /** The 64 message-schedule words made from this block. */
  schedule: number[];
  rounds: RoundTrace[];
  hashBefore: number[];
  hashAfter: number[];
}

export interface Sha256Trace {
  padded: PaddedMessage;
  blocks: BlockTrace[];
  /** The final hash as eight words, and as 64 hex digits. */
  words: number[];
  digest: string;
}

/** Hashes the text (as UTF-8 bytes) and records every round. */
export function sha256(text: string): Sha256Trace {
  const padded = pad(new TextEncoder().encode(text));
  const view = new DataView(padded.bytes.buffer);
  let hash = [...INITIAL_HASH];
  const blocks: BlockTrace[] = [];

  for (let offset = 0; offset < padded.bytes.length; offset += 64) {
    // Message schedule: the block's 16 words, stretched to 64.
    const w: number[] = [];
    for (let t = 0; t < 16; t++) w.push(view.getUint32(offset + t * 4));
    for (let t = 16; t < 64; t++) {
      w.push(add(smallSigma1(w[t - 2]), w[t - 7], smallSigma0(w[t - 15]), w[t - 16]));
    }

    // 64 rounds, each mixing one schedule word and one constant into a-h.
    let state = [...hash];
    const rounds: RoundTrace[] = [];
    for (let t = 0; t < 64; t++) {
      const [a, b, c, d, e, f, g, h] = state;
      const t1 = add(h, bigSigma1(e), choose(e, f, g), ROUND_CONSTANTS[t], w[t]);
      const t2 = add(bigSigma0(a), majority(a, b, c));
      const after = [add(t1, t2), a, b, c, add(d, t1), e, f, g];
      rounds.push({ w: w[t], k: ROUND_CONSTANTS[t], t1, t2, before: state, after });
      state = after;
    }

    // The block's result is added to the hash so far.
    const hashAfter = hash.map((word, i) => add(word, state[i]));
    blocks.push({ schedule: w, rounds, hashBefore: hash, hashAfter });
    hash = hashAfter;
  }

  return { padded, blocks, words: hash, digest: hash.map(hex).join('') };
}

/** How many of the 256 bits differ between two digests, and which ones. */
export function bitDifference(wordsA: number[], wordsB: number[]): { changed: boolean[]; count: number } {
  const changed: boolean[] = [];
  for (let i = 0; i < 8; i++) {
    const diff = (wordsA[i] ^ wordsB[i]) >>> 0;
    for (let bit = 31; bit >= 0; bit--) changed.push(((diff >>> bit) & 1) === 1);
  }
  return { changed, count: changed.filter(Boolean).length };
}
