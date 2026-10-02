import { searches } from './searching';
import { sorts } from './sorting';
import type { Algorithm } from './types';

/** Every array algorithm, in the order the sidebar lists them. */
export const algorithms: Algorithm[] = [...searches, ...sorts];

export const findAlgorithm = (id: string) => algorithms.find((algorithm) => algorithm.id === id);
