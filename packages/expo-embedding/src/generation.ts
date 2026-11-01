import { cp, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { exists } from './files';
export async function withGenerationRollback(
  paths: string[],
  generate: () => void | Promise<void>
): Promise<void> {
  const backup = await mkdtemp(join(tmpdir(), 'expo-embedding-generation-'));
  try {
    for (const [index, path] of paths.entries()) {
      if (await exists(path)) await cp(path, join(backup, String(index)), { recursive: true });
    }
    try {
      await generate();
    } catch (error) {
      for (const [index, path] of paths.entries()) {
        await rm(path, { recursive: true, force: true });
        const previous = join(backup, String(index));
        if (await exists(previous)) await cp(previous, path, { recursive: true });
      }
      throw error;
    }
  } finally {
    await rm(backup, { recursive: true, force: true });
  }
}
