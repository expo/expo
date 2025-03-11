import { randomBytes } from 'crypto';
import os from 'os';
import path from 'path';

export function createTempDirectoryPath(): string {
  return path.join(os.tmpdir(), randomBytes(16).toString('hex'));
}

export function createTempFilePath(name = ''): string {
  return `/tmp/${name}`;
}
