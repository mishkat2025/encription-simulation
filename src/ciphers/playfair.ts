import type { Cipher, Mode, PlayfairStep, Pos } from './types';
import { ALPHABET, KeyError, inputCase, lettersOnly, outputCase } from './util';

/** The secret key square from the lecture's Figure 3.13, written row by row. */
const LECTURE_SQUARE = 'LGDBAQMHECURNIFXVSOKZYWTP';

/**
 * Builds the 5×5 key square: the keyword's letters first (skipping repeats),
 * then the rest of the alphabet. i and j share a cell, so j is never placed.
 */
export function buildSquare(keyword: string): string {
  let square = '';
  for (const ch of lettersOnly(keyword).replace(/j/g, 'i') + ALPHABET) {
    if (ch !== 'j' && !square.includes(ch)) square += ch;
  }
  return square;
}

/** Splits plaintext into pairs, adding bogus letters where the rules need them. */
export function preparePairs(text: string): { pairs: string[]; notes: string[] } {
  const raw = lettersOnly(text);
  const letters = raw.replace(/j/g, 'i');
  const pairs: string[] = [];
  const notes: string[] = [];
  if (raw.includes('j')) notes.push('j is replaced by i, because the square has no cell for j.');

  let i = 0;
  while (i < letters.length) {
    const a = letters[i];
    const b = letters[i + 1];
    if (b === undefined) {
      const bogus = a === 'z' ? 'x' : 'z';
      pairs.push(a + bogus);
      notes.push(`The last letter "${a}" has no partner, so the bogus letter ${bogus} is added.`);
      i += 1;
    } else if (a === b) {
      const bogus = a === 'x' ? 'z' : 'x';
      pairs.push(a + bogus);
      notes.push(`A pair cannot be "${a}${b}", so the bogus letter ${bogus} is put after the first ${a}.`);
      i += 1;
    } else {
      pairs.push(a + b);
      i += 2;
    }
  }
  return { pairs, notes };
}

function ciphertextPairs(text: string): string[] {
  const letters = lettersOnly(text).replace(/j/g, 'i');
  if (letters.length % 2 !== 0) {
    throw new KeyError('Playfair ciphertext always has an even number of letters. This has ' + letters.length + '.');
  }
  const pairs: string[] = [];
  for (let i = 0; i < letters.length; i += 2) {
    if (letters[i] === letters[i + 1]) {
      throw new KeyError(
        `"${letters[i].toUpperCase()}${letters[i].toUpperCase()}" cannot appear in Playfair ciphertext: a pair never holds the same letter twice.`,
      );
    }
    pairs.push(letters[i] + letters[i + 1]);
  }
  return pairs;
}

function transformPair(square: string, pair: string, mode: Mode) {
  const position = (ch: string): Pos => {
    const index = square.indexOf(ch);
    return [Math.floor(index / 5), index % 5];
  };
  const at = ([r, c]: Pos) => square[r * 5 + c];
  // Encryption moves right / down by one. Decryption moves left / up, which is +4 mod 5.
  const move = mode === 'encrypt' ? 1 : 4;

  const a = position(pair[0]);
  const b = position(pair[1]);
  let rule: PlayfairStep['rule'];
  let outA: Pos;
  let outB: Pos;
  if (a[0] === b[0]) {
    rule = 'row';
    outA = [a[0], (a[1] + move) % 5];
    outB = [b[0], (b[1] + move) % 5];
  } else if (a[1] === b[1]) {
    rule = 'column';
    outA = [(a[0] + move) % 5, a[1]];
    outB = [(b[0] + move) % 5, b[1]];
  } else {
    rule = 'rectangle';
    outA = [a[0], b[1]];
    outB = [b[0], a[1]];
  }
  return { rule, inPos: [a, b] as [Pos, Pos], outPos: [outA, outB] as [Pos, Pos], result: at(outA) + at(outB) };
}

export const playfair: Cipher = {
  id: 'playfair',
  name: 'Playfair cipher',
  group: 'Polyalphabetic substitution',
  category: 'Block cipher',
  summary:
    'Letters are encrypted two at a time using a 5×5 key square. Where the two letters sit in the square decides which rule applies.',
  howItWorks: [
    'Build the square: the keyword without repeated letters, then the rest of the alphabet. i and j share a cell.',
    'Split the message into pairs. Put a bogus x between double letters, and add a bogus z if a letter is left alone at the end.',
    'Same row: take the letter to the right of each one, wrapping around.',
    'Same column: take the letter below each one, wrapping around.',
    'Otherwise the two letters are corners of a rectangle: each letter is replaced by the corner in its own row.',
    'To decrypt, move left or up instead. The rectangle rule is its own reverse.',
  ],
  params: [
    {
      id: 'keyword',
      label: 'Keyword',
      kind: 'text',
      default: 'monarchy',
      placeholder: 'letters only',
      help: 'A full 25-letter key also works: it fills the square row by row.',
    },
  ],
  examples: [
    { label: 'Slide example: "instruments", keyword monarchy', text: 'instruments', key: { keyword: 'monarchy' }, mode: 'encrypt' },
    {
      label: 'Example 3.15: "hello" with the square from Figure 3.13',
      text: 'hello',
      key: { keyword: LECTURE_SQUARE },
      mode: 'encrypt',
    },
    { label: 'Decrypt "GATLMZCLRQTX", keyword monarchy', text: 'GATLMZCLRQTX', key: { keyword: 'monarchy' }, mode: 'decrypt' },
  ],
  attacks: [],

  run(text, key, mode) {
    if (lettersOnly(key.keyword ?? '').length === 0) {
      throw new KeyError('Enter a keyword with at least one letter.');
    }
    const square = buildSquare(key.keyword);
    const prepared = mode === 'encrypt' ? preparePairs(text) : { pairs: ciphertextPairs(text), notes: [] };
    const prep = [...prepared.notes];
    if (mode === 'decrypt' && prepared.pairs.length > 0) {
      prep.push('Bogus letters added during encryption stay in the result. Remove them by reading the message.');
    }

    const steps: PlayfairStep[] = [];
    let out = '';
    for (const pair of prepared.pairs) {
      const { rule, inPos, outPos, result } = transformPair(square, pair, mode);
      out += outputCase(result, mode);
      steps.push({ input: inputCase(pair, mode), result: outputCase(result, mode), rule, inPos, outPos, out });
    }
    return { view: 'playfair', output: out, square, prep, steps };
  },
};
