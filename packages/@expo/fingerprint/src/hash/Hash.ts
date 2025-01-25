import chalk from 'chalk';
import { createHash } from 'crypto';
import { createReadStream } from 'fs';
import fs from 'fs/promises';
import pLimit from 'p-limit';
import path from 'path';
import { pipeline, type Readable } from 'stream';

import { FileHookTransform } from './FileHookTransform';
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
import { isIgnoredPathWithMatchObjects, toPosixPath } from '../utils/Path';
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

  if (!options.allowProjectFilesWithCRLF) {
    const filesWithCRLF = [];
    for (const source of fingerprintSources) {
      if (source.isCRLF && source.type === 'file') {
        filesWithCRLF.push(source.filePath);
      }
    }

    if (filesWithCRLF.length > 0) {
      console.log(chalk.yellow('The following files use CRLF:'));
      console.log(filesWithCRLF.join('\n'));
      console.log();

      console.log(
        chalk.yellow(
          'This could be problematic together with git auto-crlf enabled, which is the default on Git for Windows.'
        )
      );
      console.log();
      console.log(
        chalk.yellow(
          'You can ignore this warning by setting allowProjectFilesWithCRLF to true in the fingerprint options.'
        )
      );
      console.log();

      throw new Error('CRLF detected in files. Aborting.');
    }
  }

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
    ...((result as HashResultFile)?.isCRLF ? { isCRLF: true } : undefined),
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
      const fileHookTransform: FileHookTransform | null = options.fileHookTransform
        ? new FileHookTransform(
            { type: 'file', filePath },
            options.fileHookTransform,
            options.debug
          )
        : null;
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
      if (fileHookTransform) {
        stream = pipeline(stream, fileHookTransform, (err) => {
          if (err) {
            reject(err);
          }
        });
      }

      let sawCR = false;
      let sawLF = false;
      let fileAssumedBinary = false;

      if (!options.allowProjectFilesWithCRLF) {
      }
      stream.on('close', () => {
        if (!resolved) {
          const sawCRLF = sawCR && sawLF;

          const hex = hasher.digest('hex');
          const isTransformed = fileHookTransform?.isTransformed;
          const debugInfo = options.debug
            ? {
                path: filePath,
                hash: hex,
                ...(isTransformed ? { isTransformed } : undefined),
              }
            : undefined;
          resolve({
            type: 'file',
            id: filePath,
            hex,
            ...(debugInfo ? { debugInfo } : undefined),
            ...(sawCRLF && !fileAssumedBinary ? { isCRLF: true } : undefined),
          });
          resolved = true;
        }
      });
      stream.on('error', (e) => {
        reject(e);
      });
      stream.on('data', (chunk: Buffer | string) => {
        hasher.update(chunk);

        if (
          !options.allowProjectFilesWithCRLF ||
          fileAssumedBinary ||
          filePath.startsWith('node_modules')
        ) {
          return;
        }

        if (typeof chunk === 'string') {
          if (chunk.includes('\r')) sawCR = true;
          if (chunk.includes('\n')) sawLF = true;
        } else {
          for (const byte of chunk) {
            // Consider bytes in the range 0x07 (bell) or below or 0x7F (DEL) or above as suspicious,
            // ignoring 0x0A, 0x0D, 0x09 (LF, CR, tab).
            if ((byte < 0x20 && ![0x09, 0x0a, 0x0d].includes(byte)) || byte === 0x7f) {
              fileAssumedBinary = true;
              return;
            }

            if (byte === 0x0d) sawCR = true;
            if (byte === 0x0a) sawLF = true;
          }
        }
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
  // Using `ignoreDirMatchObjects` as an optimization to skip the whole directory
  if (isIgnoredPathWithMatchObjects(dirPath, options.ignoreDirMatchObjects)) {
    return null;
  }
  const dirents = (await fs.readdir(path.join(projectRoot, dirPath), { withFileTypes: true })).sort(
    (a, b) => a.name.localeCompare(b.name)
  );

  const results = (
    await Promise.all(
      dirents.map(async (dirent) => {
        if (dirent.isDirectory()) {
          const filePath = toPosixPath(path.join(dirPath, dirent.name));
          return await createDirHashResultsAsync(
            filePath,
            limiter,
            projectRoot,
            options,
            depth + 1
          );
        } else if (dirent.isFile()) {
          const filePath = toPosixPath(path.join(dirPath, dirent.name));
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
  let isTransformed = undefined;
  if (options.fileHookTransform) {
    const transformedContents =
      options.fileHookTransform(
        {
          type: 'contents',
          id: source.id,
        },
        source.contents,
        true /* isEndOfFile */,
        'utf8'
      ) ?? '';
    if (options.debug) {
      isTransformed = transformedContents !== source.contents;
    }
    source.contents = transformedContents;
  }

  const hex = createHash(options.hashAlgorithm).update(source.contents).digest('hex');
  const debugInfo = options.debug
    ? {
        hash: hex,
        ...(isTransformed ? { isTransformed } : undefined),
      }
    : undefined;
  return {
    type: 'contents',
    id: source.id,
    hex,
    ...(debugInfo ? { debugInfo } : undefined),
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
