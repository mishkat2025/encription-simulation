import { describe, expect, it } from 'vitest';
import {
  LabError,
  diffieHellman,
  discreteLogByTrial,
  factorByTrialDivision,
  inverseTrace,
  isPrime,
  modPow,
  orderOf,
  powTrace,
  rsaKeys,
  validExponents,
} from './numberTheory';
import { INITIAL_HASH, ROUND_CONSTANTS, bitDifference, pad, sha256 } from './sha256';

describe('number theory', () => {
  it('recognises primes', () => {
    expect([2, 3, 7, 11, 23, 97, 7919].every(isPrime)).toBe(true);
    expect([0, 1, 4, 9, 77, 91, 1001].some(isPrime)).toBe(false);
  });

  it('finds inverses with the extended Euclidean algorithm', () => {
    // 11 × 19 = 209 = 8 × 26 + 1
    expect(inverseTrace(26, 11).inverse).toBe(19);
    // 23 × 87 = 2001 = 20 × 100 + 1; the raw t is negative (−13) before reducing
    const trace = inverseTrace(100, 23);
    expect(trace.inverse).toBe(87);
    expect(trace.rawT).toBe(-13);
    // 12 and 26 share the factor 2, so there is no inverse
    expect(inverseTrace(26, 12)).toMatchObject({ gcd: 2, inverse: null });
  });

  it('computes powers with square-and-multiply', () => {
    expect(modPow(5, 13, 77)).toBe(26);
    expect(modPow(26, 37, 77)).toBe(5);
    expect(modPow(7, 0, 13)).toBe(1);
    const trace = powTrace(17, 22, 21);
    expect(trace.binary).toBe('10110');
    expect(trace.rows).toHaveLength(5);
    expect(trace.result).toBe(4);
  });

  it('matches a slow power loop for many inputs', () => {
    for (const [base, exponent, modulus] of [
      [2, 10, 1000],
      [3, 200, 13],
      [999_983, 65_537, 999_979],
      [123_456, 789, 999_983],
    ]) {
      let slow = 1n;
      for (let i = 0; i < exponent; i++) slow = (slow * BigInt(base)) % BigInt(modulus);
      expect(modPow(base, exponent, modulus)).toBe(Number(slow));
    }
  });
});

describe('RSA', () => {
  it('generates the keys for p = 7, q = 11, e = 13', () => {
    const keys = rsaKeys(7, 11, 13);
    expect(keys).toMatchObject({ n: 77, phi: 60, d: 37 });
  });

  it('decrypts what it encrypts, for every message', () => {
    const { n, e, d } = rsaKeys(7, 11, 13);
    for (let m = 0; m < n; m++) {
      expect(modPow(modPow(m, e, n), d, n)).toBe(m);
    }
  });

  it('lists valid public exponents', () => {
    expect(validExponents(60).slice(0, 5)).toEqual([7, 11, 13, 17, 19]);
  });

  it('rejects bad keys', () => {
    expect(() => rsaKeys(8, 11, 13)).toThrow(LabError);
    expect(() => rsaKeys(7, 7, 13)).toThrow(LabError);
    expect(() => rsaKeys(7, 11, 12)).toThrow(LabError);
  });

  it('is broken by factoring a small n', () => {
    const factors = factorByTrialDivision(77)!;
    expect(factors).toMatchObject({ p: 7, q: 11 });
    expect(factors.tried).toEqual([2, 3, 4, 5, 6, 7]);
    // With p and q, Eve rebuilds the private key.
    expect(rsaKeys(factors.p, factors.q, 13).d).toBe(37);
  });
});

describe('Diffie-Hellman', () => {
  it('agrees on the key 18 for p = 23, g = 7, a = 3, b = 6', () => {
    const exchange = diffieHellman(23, 7, 3, 6);
    expect(exchange.publicA.result).toBe(21);
    expect(exchange.publicB.result).toBe(4);
    expect(exchange.keyAlice.result).toBe(18);
    expect(exchange.keyBob.result).toBe(18);
  });

  it('always gives both sides the same key', () => {
    for (let a = 1; a <= 21; a++) {
      for (let b = 1; b <= 21; b++) {
        const exchange = diffieHellman(23, 5, a, b);
        expect(exchange.keyAlice.result).toBe(exchange.keyBob.result);
      }
    }
  });

  it('knows which generators are primitive roots', () => {
    expect(orderOf(7, 23)).toBe(22); // primitive root: all 22 values
    expect(orderOf(2, 23)).toBe(11); // only half of them
  });

  it('is broken by trying every exponent when p is small', () => {
    const found = discreteLogByTrial(7, 21, 23)!;
    expect(found.x).toBe(3);
    expect(found.tried.map((entry) => entry.value)).toEqual([7, 3, 21]);
  });

  it('rejects bad input', () => {
    expect(() => diffieHellman(24, 7, 3, 6)).toThrow(LabError);
    expect(() => diffieHellman(23, 7, 0, 6)).toThrow(LabError);
    expect(() => diffieHellman(23, 23, 3, 6)).toThrow(LabError);
  });
});

describe('SHA-256', () => {
  it('derives its constants from the roots of primes', () => {
    expect(INITIAL_HASH[0].toString(16)).toBe('6a09e667');
    expect(INITIAL_HASH[7].toString(16)).toBe('5be0cd19');
    expect(ROUND_CONSTANTS[0].toString(16)).toBe('428a2f98');
    expect(ROUND_CONSTANTS[63].toString(16)).toBe('c67178f2');
  });

  it('matches the official test vectors', () => {
    expect(sha256('').digest).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(sha256('abc').digest).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(sha256('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq').digest).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    );
    expect(sha256('The quick brown fox jumps over the lazy dog').digest).toBe(
      'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592',
    );
  });

  it('pads to a multiple of 64 bytes', () => {
    const short = pad(new TextEncoder().encode('abc'));
    expect(short.bytes.length).toBe(64);
    expect(short.bytes[3]).toBe(0x80);
    expect(short.bytes[63]).toBe(24); // the length, 24 bits
    // 56 bytes leaves no room for the marker and the length, so a second block is needed
    expect(pad(new Uint8Array(55)).bytes.length).toBe(64);
    expect(pad(new Uint8Array(56)).bytes.length).toBe(128);
  });

  it('records 64 rounds per block', () => {
    const trace = sha256('abc');
    expect(trace.blocks).toHaveLength(1);
    expect(trace.blocks[0].rounds).toHaveLength(64);
    expect(trace.blocks[0].hashAfter).toEqual(trace.words);
  });

  it('changes about half the output bits when one letter changes', () => {
    const { count, changed } = bitDifference(sha256('hello').words, sha256('hellp').words);
    expect(changed).toHaveLength(256);
    expect(count).toBeGreaterThan(90);
    expect(count).toBeLessThan(166);
    expect(bitDifference(sha256('hello').words, sha256('hello').words).count).toBe(0);
  });
});
