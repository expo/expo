import JsonFile from '@expo/json-file';
import fs from 'fs-extra';
import path from 'path';

import { EXPOTOOLS_DIR } from '../Constants';

function getCacheFilename(key: string) {
  return path.join(EXPOTOOLS_DIR, 'cache', `${key}.${new Date().toJSON().slice(0, 10)}.cache.json`);
}

export async function cacheData<T extends object>(key: string, value: T) {
  const filename = getCacheFilename(key);
  await fs.outputFile(filename, JSON.stringify(value, null, 2));
}

export async function readCache<T>(key: string): Promise<T | undefined> {
  if (!(await fs.pathExists(getCacheFilename(key)))) {
    return undefined;
  }
  const filename = getCacheFilename(key);
  const data = (await JsonFile.readAsync(filename)) as unknown as T;
  return data;
}
