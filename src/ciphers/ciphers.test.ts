// Checks every cipher against the worked examples in Lecture 04
// (Traditional Symmetric-Key Ciphers).

import { describe, expect, it } from 'vitest';
import { ciphers, defaultKey, findCipher } from './index';
import { buildSquare, preparePairs } from './playfair';
import { invertKey, parsePermutationKey } from './keyedTransposition';
import { SAMPLE_MESSAGE } from './additive';
import { KeyError, lettersOnly } from './util';
import type { KeyValues } from './types';

const encrypt = (id: string, text: string, key: KeyValues) => findCipher(id)!.run(text, key, 'encrypt').output;
const decrypt = (id: string, text: string, key: KeyValues) => findCipher(id)!.run(text, key, 'decrypt').output;

describe('additive cipher', () => {
  it('Example 3.3: hello with key 15 gives WTAAD', () => {
    expect(encrypt('additive', 'hello', { k: '15' })).toBe('WTAAD');
  });
  it('Example 3.4: WTAAD with key 15 gives hello', () => {
    expect(decrypt('additive', 'WTAAD', { k: '15' })).toBe('hello');
  });
  it('Example 3.5: UVACLYFZLJBYL with key 7 gives "not very secure"', () => {
    expect(decrypt('additive', 'UVACLYFZLJBYL', { k: '7' })).toBe('notverysecure');
  });
  it('rejects a key outside 0-25', () => {
    expect(() => encrypt('additive', 'hello', { k: '26' })).toThrow(KeyError);
  });
});

describe('multiplicative cipher', () => {
  it('Example 3.8: hello with key 7 gives XCZZU', () => {
    expect(encrypt('multiplicative', 'hello', { k: '7' })).toBe('XCZZU');
    expect(decrypt('multiplicative', 'XCZZU', { k: '7' })).toBe('hello');
  });
  it('rejects a key that is not in Z26*', () => {
    expect(() => encrypt('multiplicative', 'hello', { k: '4' })).toThrow(KeyError);
    expect(() => encrypt('multiplicative', 'hello', { k: '13' })).toThrow(KeyError);
  });
});

describe('affine cipher', () => {
  it('Example 3.10: hello with key (7, 2) gives ZEBBW', () => {
    expect(encrypt('affine', 'hello', { k1: '7', k2: '2' })).toBe('ZEBBW');
  });
  it('Example 3.11: ZEBBW with key (7, 2) gives hello', () => {
    expect(decrypt('affine', 'ZEBBW', { k1: '7', k2: '2' })).toBe('hello');
  });
  it('Example 3.12: k1 = 1 is the additive cipher and k2 = 0 is the multiplicative cipher', () => {
    expect(encrypt('affine', 'hello', { k1: '1', k2: '15' })).toBe(encrypt('additive', 'hello', { k: '15' }));
    expect(encrypt('affine', 'hello', { k1: '7', k2: '0' })).toBe(encrypt('multiplicative', 'hello', { k: '7' }));
  });
});

describe('monoalphabetic substitution cipher', () => {
  const table = 'NOATRBECFUXDQGYLKHVIJMPZSW';
  it('Example 3.13: encrypts with the key from Figure 3.12', () => {
    // The slide prints ICFVQRVVNEFV..., which is one letter short: it drops the
    // R for the last "e" of "message" (45 plaintext letters, 44 on the slide).
    expect(encrypt('substitution', 'this message is easy to encrypt but hard to find the key', { table })).toBe(
      'ICFVQRVVNERFVRNVSIYRGAHSLIOJICNHTIYBFGTICRXRS',
    );
  });
  it('rejects a table with a repeated letter', () => {
    expect(() => encrypt('substitution', 'hello', { table: 'AACDEFGHIJKLMNOPQRSTUVWXYZ' })).toThrow(KeyError);
  });
});

describe('autokey cipher', () => {
  it('Example 3.14: "Attack is today" with k1 = 12 gives MTMTCMSALHRDY', () => {
    expect(encrypt('autokey', 'Attack is today', { k1: '12' })).toBe('MTMTCMSALHRDY');
    expect(decrypt('autokey', 'MTMTCMSALHRDY', { k1: '12' })).toBe('attackistoday');
  });
});

describe('Playfair cipher', () => {
  it('builds the key square from a keyword', () => {
    expect(buildSquare('monarchy')).toBe('monarchybdefgiklpqstuvwxz');
  });
  it('splits the message into pairs with bogus letters, as on the slides', () => {
    expect(preparePairs('instruments').pairs).toEqual(['in', 'st', 'ru', 'me', 'nt', 'sz']);
    expect(preparePairs('hello').pairs).toEqual(['he', 'lx', 'lo']);
    expect(preparePairs('helloe').pairs).toEqual(['he', 'lx', 'lo', 'ez']);
  });
  it('slide example: instruments with keyword monarchy gives GATLMZCLRQTX', () => {
    expect(encrypt('playfair', 'instruments', { keyword: 'monarchy' })).toBe('GATLMZCLRQTX');
    expect(decrypt('playfair', 'GATLMZCLRQTX', { keyword: 'monarchy' })).toBe('instrumentsz');
  });
  it('Example 3.15: hello with the square from Figure 3.13 gives ECQZBX', () => {
    expect(encrypt('playfair', 'hello', { keyword: 'LGDBAQMHECURNIFXVSOKZYWTP' })).toBe('ECQZBX');
  });
});

describe('Vigenère cipher', () => {
  it('Example 3.16: "She is listening" with keyword PASCAL gives HHWKSWXSLGNTCG', () => {
    expect(encrypt('vigenere', 'She is listening', { keyword: 'PASCAL' })).toBe('HHWKSWXSLGNTCG');
    expect(decrypt('vigenere', 'HHWKSWXSLGNTCG', { keyword: 'PASCAL' })).toBe('sheislistening');
  });
});

describe('rail fence cipher', () => {
  it('Example 3.22: "Meet me at the park" gives MEMATEAKETETHPR', () => {
    expect(encrypt('rail-fence', 'Meet me at the park', { rails: '2' })).toBe('MEMATEAKETETHPR');
    expect(decrypt('rail-fence', 'MEMATEAKETETHPR', { rails: '2' })).toBe('meetmeatthepark');
  });
});

describe('columnar transposition', () => {
  it('slide example: "Meet me at the park" in 4 columns gives MMTAEEHREAEKTTP', () => {
    expect(encrypt('columnar', 'Meet me at the park', { cols: '4' })).toBe('MMTAEEHREAEKTTP');
    expect(decrypt('columnar', 'MMTAEEHREAEKTTP', { cols: '4' })).toBe('meetmeatthepark');
  });
});

describe('keyed transposition cipher', () => {
  it('reads keys with or without spaces', () => {
    expect(parsePermutationKey('3 1 4 5 2')).toEqual([3, 1, 4, 5, 2]);
    expect(parsePermutationKey('31452')).toEqual([3, 1, 4, 5, 2]);
  });
  it('derives the decryption key 2 5 1 3 4 from 3 1 4 5 2', () => {
    expect(invertKey([3, 1, 4, 5, 2])).toEqual([2, 5, 1, 3, 4]);
  });
  it('slide example: "Enemy attacks tonight" gives EEMYN TAACT TKONS HITZG', () => {
    expect(encrypt('keyed-transposition', 'Enemy attacks tonight', { key: '3 1 4 5 2' })).toBe('EEMYNTAACTTKONSHITZG');
    expect(decrypt('keyed-transposition', 'EEMYNTAACTTKONSHITZG', { key: '3 1 4 5 2' })).toBe('enemyattackstonightz');
  });
  it('rejects a key that is not a permutation', () => {
    expect(() => encrypt('keyed-transposition', 'hello', { key: '1 2 2' })).toThrow(KeyError);
  });
});

describe('every cipher', () => {
  it.each(ciphers.map((cipher) => [cipher.name, cipher] as const))(
    '%s: decrypting what was encrypted gives the message back',
    (_name, cipher) => {
      const key = defaultKey(cipher);
      const encrypted = cipher.run(SAMPLE_MESSAGE, key, 'encrypt').output;
      const decrypted = cipher.run(encrypted, key, 'decrypt').output;
      // Playfair and keyed transposition may add bogus letters, so compare the start only.
      expect(decrypted.replace(/x(?=.)|z$/g, '').startsWith(lettersOnly(SAMPLE_MESSAGE).slice(0, 10))).toBe(true);
      if (cipher.id !== 'playfair' && cipher.id !== 'keyed-transposition') {
        expect(decrypted).toBe(lettersOnly(SAMPLE_MESSAGE));
      }
    },
  );

  it.each(ciphers.map((cipher) => [cipher.name, cipher] as const))(
    '%s: the last step holds the full output and every example runs',
    (_name, cipher) => {
      for (const example of cipher.examples) {
        const trace = cipher.run(example.text, example.key, example.mode);
        expect(trace.output.length).toBeGreaterThan(0);
        expect(trace.steps[trace.steps.length - 1].out).toBe(trace.output);
      }
    },
  );

  it.each(ciphers.map((cipher) => [cipher.name, cipher] as const))('%s: an empty message gives no steps', (_name, cipher) => {
    const trace = cipher.run('', defaultKey(cipher), 'encrypt');
    expect(trace.output).toBe('');
    expect(trace.steps).toEqual([]);
  });
});
