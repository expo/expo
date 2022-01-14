import JsonFile from '@expo/json-file';
import fs from 'fs-extra';
import path from 'path';

import { EXPOTOOLS_DIR } from '../Constants';

const MEMORY_CACHE = {}

function getCacheFilename(key: string) {
  return path.join(EXPOTOOLS_DIR, 'cache', `${key}.${new Date().toJSON().slice(0, 10)}.cache.json`);
}

export async function cacheData<T extends object>(key: string, value: T) {
  const filename = getCacheFilename(key);
  const stringData = JSON.stringify(value, null, 2)
  MEMORY_CACHE[filename] = JSON.parse(JSON.stringify(value))
  await fs.outputFile(filename, stringData);
}

export async function readCache<T>(key: string): Promise<T | undefined> {
  if (!(await fs.pathExists(getCacheFilename(key)))) {
    return undefined;
  }
  const filename = getCacheFilename(key);
  if (MEMORY_CACHE[filename]) {
    return MEMORY_CACHE[filename] as T
  }
  const data = (await JsonFile.readAsync(filename)) as unknown as T;
  return data;
}
