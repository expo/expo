import fs from 'fs';
import path from 'path';

export function findUpProjectRoot(cwd: string): string | null {
  if (['.', path.sep].includes(cwd)) {
    return null;
  }

  if (fs.existsSync(path.join(cwd, 'package.json'))) {
    return cwd;
  } else {
    return findUpProjectRoot(path.dirname(cwd));
  }
}
