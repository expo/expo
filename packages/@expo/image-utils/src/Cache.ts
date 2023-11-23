import crypto from 'crypto';
import { ensureDir, readdirSync, readFile, readFileSync, remove, writeFile } from 'fs-extra';
import { join, resolve } from 'path';

import { ImageOptions } from './Image.types';

const CACHE_LOCATION = '.expo/web/cache/production/images';

const cacheKeys: { [key: string]: string } = {};

// Calculate SHA256 Checksum value of a file based on its contents
function calculateHash(filePath: string): string {
  const contents = filePath.startsWith('http') ? filePath : readFileSync(filePath);
  return crypto.createHash('sha256').update(contents).digest('hex');
}

// Create a hash key for caching the images between builds
export function createCacheKey(fileSource: string, properties: string[]): string {
  const hash = calculateHash(fileSource);
  return [hash].concat(properties).filter(Boolean).join('-');
}

export async function createCacheKeyWithDirectoryAsync(
  projectRoot: string,
  type: string,
  icon: ImageOptions
): Promise<string> {
  const cacheKey = `${type}-${createCacheKey(icon.src, [icon.resizeMode, icon.backgroundColor])}`;
  if (!(cacheKey in cacheKeys)) {
    cacheKeys[cacheKey] = await ensureCacheDirectory(projectRoot, type, cacheKey);
  }

  return cacheKey;
}

export async function ensureCacheDirectory(
  projectRoot: string,
  type: string,
  cacheKey: string
): Promise<string> {
  const cacheFolder = join(projectRoot, CACHE_LOCATION, type, cacheKey);
  await ensureDir(cacheFolder);
  return cacheFolder;
}

export async function getImageFromCacheAsync(
  fileName: string,
  cacheKey: string
): Promise<null | Buffer> {
  try {
    return await readFile(resolve(cacheKeys[cacheKey], fileName));
  } catch {
    return null;
  }
}

export async function cacheImageAsync(
  fileName: string,
  buffer: Buffer,
  cacheKey: string
): Promise<void> {
  try {
    await writeFile(resolve(cacheKeys[cacheKey], fileName), buffer);
  } catch ({ message }) {
    console.warn(`Error caching image: "${fileName}". ${message}`);
  }
}

export async function clearUnusedCachesAsync(projectRoot: string, type: string): Promise<void> {
  // Clean up any old caches
  const cacheFolder = join(projectRoot, CACHE_LOCATION, type);
  await ensureDir(cacheFolder);
  const currentCaches = readdirSync(cacheFolder);

  if (!Array.isArray(currentCaches)) {
    console.warn('Failed to read the icon cache');
    return;
  }
  const deleteCachePromises: Promise<void>[] = [];
  for (const cache of currentCaches) {
    // skip hidden folders
    if (cache.startsWith('.')) {
      continue;
    }

    // delete
    if (!(cache in cacheKeys)) {
      deleteCachePromises.push(remove(join(cacheFolder, cache)));
    }
  }

  await Promise.all(deleteCachePromises);
}
