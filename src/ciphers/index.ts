import type { Cipher, Group } from './types';
import { additive } from './additive';
import { multiplicative } from './multiplicative';
import { affine } from './affine';
import { substitution } from './substitution';
import { autokey } from './autokey';
import { playfair } from './playfair';
import { vigenere } from './vigenere';
import { railFence } from './railFence';
import { columnar } from './columnar';
import { keyedTransposition } from './keyedTransposition';

/** Every cipher in the app, in the order the lecture introduces them. */
export const ciphers: Cipher[] = [
  additive,
  multiplicative,
  affine,
  substitution,
  autokey,
  playfair,
  vigenere,
  railFence,
  columnar,
  keyedTransposition,
];

export const groups: Group[] = ['Monoalphabetic substitution', 'Polyalphabetic substitution', 'Transposition'];

export const findCipher = (id: string) => ciphers.find((cipher) => cipher.id === id);

/** The key a cipher starts with: each parameter's default value. */
export const defaultKey = (cipher: Cipher) =>
  Object.fromEntries(cipher.params.map((param) => [param.id, param.default]));
