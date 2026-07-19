import { randomBytes } from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

const uniqueTempPath = (): string => {
  return path.join(os.tmpdir(), randomBytes(16).toString('hex'));
};

// Functionally equivalent to: https://github.com/sindresorhus/tempy/blob/943ade0c935367117adbe2b690516ebc94139c6d/index.js#L43-L47
export function createTempDirectoryPath(): string {
  const directory = uniqueTempPath();
  fs.mkdirSync(directory);
  return directory;
}

// Functionally equivalent to: https://github.com/sindresorhus/tempy/blob/943ade0c935367117adbe2b690516ebc94139c6d/index.js#L25-L39
export function createTempFilePath(name = ''): string {
  if (name) {
    return path.join(createTempDirectoryPath(), name);
  } else {
    return uniqueTempPath();
  }
}
