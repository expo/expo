import { promises as fs } from 'fs';

export function ensureDirAsync(path: string) {
  return fs.mkdir(path, { recursive: true });
}
