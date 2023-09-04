import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import type { NormalizedOptions, Options } from './Fingerprint.types';

export const FINGERPRINT_IGNORE_FILENAME = '.fingerprintignore';

export const DEFAULT_IGNORES = [
  FINGERPRINT_IGNORE_FILENAME,
  '**/android/build/**/*',
  '**/android/app/build/**/*',
  '**/android/app/.cxx/**/*',
  '**/ios/Pods/**/*',
];

export async function normalizeOptionsAsync(
  projectRoot: string,
  options?: Options
): Promise<NormalizedOptions> {
  return {
    ...options,
    platforms: options?.platforms ?? ['android', 'ios'],
    concurrentIoLimit: options?.concurrentIoLimit ?? os.cpus().length,
    hashAlgorithm: options?.hashAlgorithm ?? 'sha1',
    ignores: await collectIgnoresAsync(projectRoot, options),
  };
}

async function collectIgnoresAsync(projectRoot: string, options?: Options): Promise<string[]> {
  const ignores = [
    ...DEFAULT_IGNORES,
    ...(options?.ignores ?? []),
    ...(options?.dirExcludes?.map((dirExclude) => `${dirExclude}/**/*`) ?? []),
  ];

  const fingerprintIgnorePath = path.join(projectRoot, FINGERPRINT_IGNORE_FILENAME);
  try {
    const fingerprintIgnore = await fs.readFile(fingerprintIgnorePath, 'utf8');
    const fingerprintIgnoreLines = fingerprintIgnore.split('\n');
    for (const line of fingerprintIgnoreLines) {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        ignores.push(trimmedLine);
      }
    }
  } catch {}

  return ignores;
}
