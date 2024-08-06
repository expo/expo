import path from 'path';
import uniqueString from 'unique-string';
import os from 'os';

export function createTempDirectoryPath(): string {
  return path.join(os.tmpdir(), uniqueString());
}

export function createTempFilePath(name = ''): string {
  return `/tmp/${name}`;
}
