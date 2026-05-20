import fs from 'node:fs';

const REGEXP_REPLACE_SLASHES = /\\/g;

export async function directoryExistsAsync(file) {
  return (await fs.promises.stat(file).catch(() => null))?.isDirectory() ?? false;
}

export function toPosixPath(filePath) {
  return filePath.replace(REGEXP_REPLACE_SLASHES, '/');
}
