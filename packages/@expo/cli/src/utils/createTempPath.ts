import fs from 'fs';
import path from 'path';
import tempDir from 'temp-dir';
import uniqueString from 'unique-string';

const uniqueTempPath = (): string => path.join(tempDir, uniqueString());

export function createTempDirectoryPath(): string {
  const directory = uniqueTempPath();
  fs.mkdirSync(directory);
  return directory;
}

export function createTempFilePath(name = ''): string {
  if (name) {
    return path.join(createTempDirectoryPath(), name);
  } else {
    return uniqueTempPath();
  }
}
