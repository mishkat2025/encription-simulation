// The list of everything the site can show. The sidebar, the header and the
// address bar all work from this one list.

import type { ReactNode } from 'react';
import { ciphers } from './ciphers';
import { CipherPage } from './components/CipherPage';
import { algorithms } from './dsa';
import { AlgorithmPage } from './dsa/AlgorithmPage';
import { labs } from './labs';

/** The site is split into areas. Each has its own list of topics in the sidebar. */
export const areas = [
  { id: 'crypto', name: 'Cryptography' },
  { id: 'dsa', name: 'Data structures and algorithms' },
] as const;

export type AreaId = (typeof areas)[number]['id'];

export interface Topic {
  /** Also the address: #rsa, #quick-sort ... */
  id: string;
  name: string;
  /** The heading it sits under in the sidebar. */
  group: string;
  area: AreaId;
  render: () => ReactNode;
}

export const topics: Topic[] = [
  ...ciphers.map((cipher): Topic => ({
    id: cipher.id,
    name: cipher.name,
    group: cipher.group,
    area: 'crypto',
    render: () => <CipherPage cipher={cipher} />,
  })),
  ...labs.map((lab): Topic => ({
    id: lab.id,
    name: lab.name,
    group: lab.group,
    area: 'crypto',
    render: () => <lab.component />,
  })),
  ...algorithms.map((algorithm): Topic => ({
    id: algorithm.id,
    name: algorithm.name,
    group: algorithm.group,
    area: 'dsa',
    render: () => <AlgorithmPage algorithm={algorithm} />,
  })),
];

export const findTopic = (id: string) => topics.find((topic) => topic.id === id);

/** The first topic of an area: where its header link goes. */
export const firstTopic = (area: AreaId) => topics.find((topic) => topic.area === area)!;
