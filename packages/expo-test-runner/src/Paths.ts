import { randomBytes } from 'crypto';
import { mkdirSync, realpathSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

export const SelfPath = join(__dirname, '..');

export function temporaryDirectory() {
  const directory = join(realpathSync(tmpdir()), randomBytes(16).toString('hex'));
  mkdirSync(directory);
  return directory;
}
