import { createHash } from 'crypto';
import { createReadStream } from 'fs';
import fs from 'fs/promises';
import minimatch from 'minimatch';
import pLimit from 'p-limit';
import path from 'path';

import type {
  Fingerprint,
  FingerprintSource,
  HashResult,
  HashSource,
  HashSourceContents,
  NormalizedOptions,
} from '../Fingerprint.types';
import { profile } from '../utils/Profile';

/**
 * Create a `Fingerprint` from `HashSources` array
 */
export async function createFingerprintFromSourcesAsync(
  sources: HashSource[],
  projectRoot: string,
  options: NormalizedOptions
): Promise<Fingerprint> {
  const limiter = pLimit(options.concurrentIoLimit);
  const fingerprintSources = await Promise.all(
    sources.map((source) => createFingerprintSourceAsync(source, limiter, projectRoot, options))
  );

  const hasher = createHash(options.hashAlgorithm);
  for (const source of fingerprintSources) {
    if (source.hash != null) {
      hasher.update(createSourceId(source));
      hasher.update(source.hash);
    }
  }
  const hash = hasher.digest('hex');

  return {
    sources: fingerprintSources,
    hash,
  };
}

/**
 * Create a `FingerprintSource` from a `HashSource`
 * This function will get a hash value and merge back to original source
 */
export async function createFingerprintSourceAsync(
  source: HashSource,
  limiter: pLimit.Limit,
  projectRoot: string,
  options: NormalizedOptions
): Promise<FingerprintSource> {
  let result: HashResult | null = null;
  switch (source.type) {
    case 'contents':
      result = await createContentsHashResultsAsync(source, options);
      break;
    case 'file':
      result = await createFileHashResultsAsync(source.filePath, limiter, projectRoot, options);
      break;
    case 'dir':
      result = await profile(
        createDirHashResultsAsync,
        `createDirHashResultsAsync(${source.filePath})`
      )(source.filePath, limiter, projectRoot, options);
      break;
    default:
      throw new Error('Unsupported source type');
  }

  return { ...source, hash: result?.hex ?? null };
}

/**
 * Create a `HashResult` from a file
 */
export async function createFileHashResultsAsync(
  filePath: string,
  limiter: pLimit.Limit,
  projectRoot: string,
  options: NormalizedOptions
): Promise<HashResult> {
  // Backup code for faster hashing
  /*
  return limiter(async () => {
    const hasher = createHash(options.hashAlgorithm);

    const stat = await fs.stat(filePath);
    hasher.update(`${stat.size}`);

    const buffer = Buffer.alloc(4096);
    const fd = await fs.open(filePath, 'r');
    await fd.read(buffer, 0, buffer.length, 0);
    await fd.close();
    hasher.update(buffer);
    console.log('stat', filePath, stat.size);
    return { id: path.relative(projectRoot, filePath), hex: hasher.digest('hex') };
  });
  */

  return limiter(() => {
    return new Promise<HashResult>((resolve, reject) => {
      let resolved = false;
      const hasher = createHash(options.hashAlgorithm);
      const stream = createReadStream(path.join(projectRoot, filePath));
      stream.on('close', () => {
        if (!resolved) {
          const hex = hasher.digest('hex');
          resolve({ id: filePath, hex });
          resolved = true;
        }
      });
      stream.on('error', (e) => {
        reject(e);
      });
      stream.on('data', (chunk) => {
        hasher.update(chunk);
      });
    });
  });
}

/**
 * Indicate the given `dirPath` should be excluded by `dirExcludes`
 */
function isExcludedDir(dirPath: string, dirExcludes: string[]): boolean {
  for (const exclude of dirExcludes) {
    if (minimatch(dirPath, exclude)) {
      return true;
    }
  }
  return false;
}

/**
 * Create `HashResult` for a dir.
 * If the dir is excluded, returns null rather than a HashResult
 */
export async function createDirHashResultsAsync(
  dirPath: string,
  limiter: pLimit.Limit,
  projectRoot: string,
  options: NormalizedOptions,
  depth: number = 0
): Promise<HashResult | null> {
  if (isExcludedDir(dirPath, options.dirExcludes)) {
    return null;
  }
  const dirents = (await fs.readdir(path.join(projectRoot, dirPath), { withFileTypes: true })).sort(
    (a, b) => a.name.localeCompare(b.name)
  );
  const promises: Promise<HashResult | null>[] = [];
  for (const dirent of dirents) {
    if (dirent.isDirectory()) {
      const filePath = path.join(dirPath, dirent.name);
      promises.push(createDirHashResultsAsync(filePath, limiter, projectRoot, options, depth + 1));
    } else if (dirent.isFile()) {
      const filePath = path.join(dirPath, dirent.name);
      promises.push(createFileHashResultsAsync(filePath, limiter, projectRoot, options));
    }
  }

  const hasher = createHash(options.hashAlgorithm);
  const results = await Promise.all(promises);
  for (const result of results) {
    if (result != null) {
      hasher.update(result.id);
      hasher.update(result.hex);
    }
  }
  const hex = hasher.digest('hex');

  return { id: dirPath, hex };
}

/**
 * Create `HashResult` for a `HashSourceContents`
 */
export async function createContentsHashResultsAsync(
  source: HashSourceContents,
  options: NormalizedOptions
): Promise<HashResult> {
  const hex = createHash(options.hashAlgorithm).update(source.contents).digest('hex');
  return { id: source.id, hex };
}

/**
 * Create id from given source
 */
export function createSourceId(source: HashSource): string {
  switch (source.type) {
    case 'contents':
      return source.id;
    case 'file':
      return source.filePath;
    case 'dir':
      return source.filePath;
    default:
      throw new Error('Unsupported source type');
  }
}
