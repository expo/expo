import fs from 'fs/promises';

import { Fingerprint } from '../../../build/Fingerprint.types';

export default async function readFingerprintFileAsync(path: string): Promise<Fingerprint> {
  try {
    return JSON.parse(await fs.readFile(path, 'utf-8'));
  } catch (e: any) {
    throw new Error(`Unable to read fingerprint file ${path}: ${e.message}`);
  }
}
