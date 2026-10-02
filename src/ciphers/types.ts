// Shared types for every cipher.
//
// A cipher's `run` function does not just return the answer: it returns a
// "trace", which is the answer plus the list of small steps that produced it.
// The UI plays those steps back one at a time.

export type Mode = 'encrypt' | 'decrypt';

/** Key fields come straight from the form inputs, so they are all strings. */
export type KeyValues = Record<string, string>;

export interface ParamDef {
  id: string;
  label: string;
  kind: 'number' | 'select' | 'text';
  default: string;
  min?: number;
  max?: number;
  options?: string[];
  placeholder?: string;
  help?: string;
  /** Shows a "Random" button that fills in a shuffled alphabet. */
  randomAlphabet?: boolean;
}

/* ---------- strip view: one letter at a time through an alphabet mapping ---------- */

export interface StripStep {
  inChar: string;
  outChar: string;
  inNum: number;
  outNum: number;
  /** Column of the alphabet strip to highlight (the plaintext letter's index). */
  plainIndex: number;
  /** The cipher alphabet in effect for this letter: mapping[p] is the ciphertext for plaintext p. */
  mapping: string;
  keyNum?: number;
  keyChar?: string;
  calc: string;
  /** Output produced so far, including this step. */
  out: string;
}

export interface StripTrace {
  view: 'strip';
  output: string;
  steps: StripStep[];
  /** False for the table-lookup cipher, which has no arithmetic to show. */
  showNumbers: boolean;
  /**
   * 'none': one key for the whole message.
   * 'upfront': each letter has its own key value, known before starting (Vigenère).
   * 'revealed': each key value is only known once the previous letter is done (autokey decryption).
   */
  keyStream: 'none' | 'upfront' | 'revealed';
}

/* ---------- Playfair view ---------- */

export type Pos = [row: number, col: number];

export interface PlayfairStep {
  input: string;
  result: string;
  rule: 'row' | 'column' | 'rectangle';
  inPos: [Pos, Pos];
  outPos: [Pos, Pos];
  out: string;
}

export interface PlayfairTrace {
  view: 'playfair';
  output: string;
  /** The 25 letters of the key square, row by row. */
  square: string;
  /** Notes about how the message was cleaned up and split into pairs. */
  prep: string[];
  steps: PlayfairStep[];
}

/* ---------- grid view: write letters into a grid, read them out in another order ---------- */

export interface GridStep {
  phase: 'write' | 'read';
  r: number;
  c: number;
  ch: string;
  out: string;
}

export interface GridTrace {
  view: 'grid';
  output: string;
  rows: number;
  cols: number;
  /** The cells that hold a letter (for rail fence this is the zigzag). */
  slots: { r: number; c: number }[];
  steps: GridStep[];
  writeCaption: string;
  readCaption: string;
  /** Labels drawn above the columns (columnar: "1", "2" ...) or left of the rows (rail fence: "Rail 1" ...). */
  columnLabels?: string[];
  rowLabels?: string[];
}

/* ---------- permutation view: reorder the letters inside fixed-size blocks ---------- */

export interface PermStep {
  block: number;
  /** Output position being filled (0-based). */
  to: number;
  /** Input position the letter comes from (0-based). */
  from: number;
  ch: string;
  out: string;
}

export interface PermutationTrace {
  view: 'permutation';
  output: string;
  size: number;
  /** output[j] = input[perm[j]] within each block (0-based). */
  perm: number[];
  encKey: number[];
  decKey: number[];
  blocks: { input: string; output: string }[];
  steps: PermStep[];
  /** How many filler letters were added to complete the last block. */
  padding: number;
}

export type Trace = StripTrace | PlayfairTrace | GridTrace | PermutationTrace;

/* ---------- cipher definition ---------- */

export type Group =
  | 'Monoalphabetic substitution'
  | 'Polyalphabetic substitution'
  | 'Transposition';

export type AttackKind = 'brute' | 'frequency';

export interface Example {
  label: string;
  text: string;
  key: KeyValues;
  mode: Mode;
}

export interface Cipher {
  id: string;
  name: string;
  aka?: string;
  group: Group;
  category?: 'Stream cipher' | 'Block cipher';
  summary: string;
  formula?: { encrypt: string; decrypt: string };
  howItWorks: string[];
  params: ParamDef[];
  examples: Example[];
  attacks: AttackKind[];
  /** A longer message used as the default target on the "Break it" tab. */
  attackSample?: { text: string; key: KeyValues };
  /** Throws a KeyError (see util.ts) when the key or message is not valid. */
  run(text: string, key: KeyValues, mode: Mode): Trace;
}
