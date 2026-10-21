import { cpSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export function withGenerationRollback(paths: string[], generate: () => void): void {
  const backup = mkdtempSync(join(tmpdir(), 'expo-embedding-generation-'));
  try {
    for (const [index, path] of paths.entries()) {
      if (existsSync(path)) cpSync(path, join(backup, String(index)), { recursive: true });
    }
    try {
      generate();
    } catch (error) {
      for (const [index, path] of paths.entries()) {
        rmSync(path, { recursive: true, force: true });
        const previous = join(backup, String(index));
        if (existsSync(previous)) cpSync(previous, path, { recursive: true });
      }
      throw error;
    }
  } finally {
    rmSync(backup, { recursive: true, force: true });
  }
}
