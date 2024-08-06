import { join } from 'path';
import { mkdirSync } from 'fs';
import tempDir from 'temp-dir';
import uniqueString from 'unique-string';

export const SelfPath = join(__dirname, '..');

export function temporaryDirectory() {
  const directory = join(tempDir, uniqueString());
  mkdirSync(directory);
  return directory;
}
