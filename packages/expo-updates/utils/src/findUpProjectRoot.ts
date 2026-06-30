import fs from 'fs';
import path from 'path';

export function findUpProjectRoot(cwd: string): string | null {
  if (cwd === path.sep || cwd === '.') {
    return null;
  }

  for (let dir = cwd; path.dirname(dir) !== dir; dir = path.dirname(dir)) {
    const file = path.resolve(dir, 'package.json');
    if (fs.existsSync(file)) {
      return dir;
    }
  }
  return null;
}
