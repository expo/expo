import fs from 'fs/promises';
import path from 'path';

import type { HashSource } from '../Fingerprint.types';

export async function getFileBasedHashSourceAsync(
  projectRoot: string,
  filePath: string,
  reason: string
): Promise<HashSource | null> {
  let result: HashSource | null = null;
  try {
    const stat = await fs.stat(path.join(projectRoot, filePath));
    result = {
      type: stat.isDirectory() ? 'dir' : 'file',
      filePath,
      reasons: [reason],
    };
  } catch {
    result = null;
  }
  return result;
}
