import type { ComponentType } from 'react';
import { DiffieHellmanLab } from './DiffieHellmanLab';
import { HashLab } from './HashLab';
import { RsaLab } from './RsaLab';

/**
 * A "lab" is a topic with its own page layout. The classical ciphers all
 * share one page (CipherPage); these do not fit that mould, so each one
 * brings its own component.
 */
export interface Lab {
  id: string;
  name: string;
  group: string;
  component: ComponentType;
}

export const labs: Lab[] = [
  { id: 'rsa', name: 'RSA', group: 'Public-key cryptography', component: RsaLab },
  { id: 'diffie-hellman', name: 'Diffie-Hellman key exchange', group: 'Public-key cryptography', component: DiffieHellmanLab },
  { id: 'sha-256', name: 'SHA-256 hashing', group: 'Hash functions', component: HashLab },
];

export const findLab = (id: string) => labs.find((lab) => lab.id === id);
