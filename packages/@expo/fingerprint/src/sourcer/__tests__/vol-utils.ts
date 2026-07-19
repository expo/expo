import fs from 'fs';
import { vol } from 'memfs';
import path from 'path';

jest.unmock('fs');

/**
 * Helper to copy a directory to another directory in memfs.
 * Mainly because our current memfs version doesn't support `fs.cp`.
 */
export function copyDirSync(src: string, dest: string): void {
  const entries = fs.readdirSync(src, { withFileTypes: true }) as fs.Dirent[];
  if (!vol.existsSync(dest)) {
    vol.mkdirSync(dest, { recursive: true });
  }

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else if (entry.isFile()) {
      const data = fs.readFileSync(srcPath);
      vol.writeFileSync(destPath, data);
    }
  }
}
