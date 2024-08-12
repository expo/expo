import { createHash } from 'crypto';
import { createReadStream } from 'fs';
import fs from 'fs/promises';
import pLimit from 'p-limit';
import path from 'path';
import { pipeline, type Readable } from 'stream';

import { ReactImportsPatchTransform } from './ReactImportsPatcher';
import type {
  DebugInfoDir,
  DebugInfoFile,
  Fingerprint,
  FingerprintSource,
  HashResult,
  HashResultContents,
  HashResultDir,
  HashResultFile,
  HashSource,
  HashSourceContents,
  NormalizedOptions,
} from '../Fingerprint.types';
import { isIgnoredPathWithMatchObjects } from '../utils/Path';
import { nonNullish } from '../utils/Predicates';
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
        options,
        createDirHashResultsAsync,
        `createDirHashResultsAsync(${source.filePath})`
      )(source.filePath, limiter, projectRoot, options);
      break;
    default:
      throw new Error('Unsupported source type');
  }

  return {
    ...source,
    hash: result?.hex ?? null,
    ...(options.debug ? { debugInfo: result?.debugInfo } : undefined),
  };
}

/**
 * Create a `HashResult` from a file
 */
export async function createFileHashResultsAsync(
  filePath: string,
  limiter: pLimit.Limit,
  projectRoot: string,
  options: NormalizedOptions
): Promise<HashResultFile | null> {
  // Backup code for faster hashing
  /*
  return limiter(async () => {
    if (isIgnoredPathWithMatchObjects(filePath, options.ignorePathMatchObjects)) {
      return null;
    }

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
    return new Promise<HashResultFile | null>((resolve, reject) => {
      if (isIgnoredPathWithMatchObjects(filePath, options.ignorePathMatchObjects)) {
        return resolve(null);
      }

      let resolved = false;
      const hasher = createHash(options.hashAlgorithm);
      let stream: Readable = createReadStream(path.join(projectRoot, filePath), {
        highWaterMark: 1024,
      });
      if (
        options.enableReactImportsPatcher &&
        options.platforms.includes('ios') &&
        (filePath.endsWith('.h') || filePath.endsWith('.m') || filePath.endsWith('.mm'))
      ) {
        const transform = new ReactImportsPatchTransform();
        stream = pipeline(stream, transform, (err) => {
          if (err) {
            reject(err);
          }
        });
      }
      stream.on('close', () => {
        if (!resolved) {
          const hex = hasher.digest('hex');
          resolve({
            type: 'file',
            id: filePath,
            hex,
            ...(options.debug ? { debugInfo: { path: filePath, hash: hex } } : undefined),
          });
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
 * Create `HashResult` for a dir.
 * If the dir is excluded, returns null rather than a HashResult
 */
export async function createDirHashResultsAsync(
  dirPath: string,
  limiter: pLimit.Limit,
  projectRoot: string,
  options: NormalizedOptions,
  depth: number = 0
): Promise<HashResultDir | null> {
  if (isIgnoredPathWithMatchObjects(dirPath, options.ignorePathMatchObjects)) {
    return null;
  }
  const dirents = (await fs.readdir(path.join(projectRoot, dirPath), { withFileTypes: true })).sort(
    (a, b) => a.name.localeCompare(b.name)
  );

  const results = (
    await Promise.all(
      dirents.map(async (dirent) => {
        if (dirent.isDirectory()) {
          const filePath = path.join(dirPath, dirent.name);
          return await createDirHashResultsAsync(
            filePath,
            limiter,
            projectRoot,
            options,
            depth + 1
          );
        } else if (dirent.isFile()) {
          const filePath = path.join(dirPath, dirent.name);
          return await createFileHashResultsAsync(filePath, limiter, projectRoot, options);
        }

        return null;
      })
    )
  ).filter(nonNullish);
  if (results.length === 0) {
    return null;
  }

  const hasher = createHash(options.hashAlgorithm);

  const children: (DebugInfoFile | DebugInfoDir | undefined)[] = [];
  for (const result of results) {
    hasher.update(result.id);
    hasher.update(result.hex);
    children.push(result.debugInfo);
  }
  const hex = hasher.digest('hex');

  return {
    type: 'dir',
    id: dirPath,
    hex,
    ...(options.debug ? { debugInfo: { path: dirPath, children, hash: hex } } : undefined),
  };
}

/**
 * Create `HashResult` for a `HashSourceContents`
 */
export async function createContentsHashResultsAsync(
  source: HashSourceContents,
  options: NormalizedOptions
): Promise<HashResultContents> {
  const hex = createHash(options.hashAlgorithm).update(source.contents).digest('hex');
  return {
    type: 'contents',
    id: source.id,
    hex,
    ...(options.debug ? { debugInfo: { hash: hex } } : undefined),
  };
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
