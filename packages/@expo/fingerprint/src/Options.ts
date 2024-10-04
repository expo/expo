import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import type { NormalizedOptions, Options } from './Fingerprint.types';

export const FINGERPRINT_IGNORE_FILENAME = '.fingerprintignore';

export const DEFAULT_IGNORE_PATHS = [
  FINGERPRINT_IGNORE_FILENAME,
  '**/android/build/**/*',
  '**/android/app/build/**/*',
  '**/android/app/.cxx/**/*',
  '**/ios/Pods/**/*',
  '**/ios/build/**/*',
  '**/ios/*.xcworkspace/xcuserdata/**/*',

  // Ignore all expo configs because we will read expo config in a HashSourceContents already
  'app.config.ts',
  'app.config.js',
  'app.config.json',
  'app.json',

  // Ignore default javascript files when calling `getConfig()`
  '**/node_modules/@babel/**/*',
  '**/node_modules/@expo/**/*',
  '**/node_modules/@jridgewell/**/*',
  '**/node_modules/expo/config.js',
  '**/node_modules/expo/config-plugins.js',
  `**/node_modules/{${[
    'debug',
    'escape-string-regexp',
    'getenv',
    'graceful-fs',
    'has-flag',
    'imurmurhash',
    'js-tokens',
    'json5',
    'lines-and-columns',
    'require-from-string',
    'resolve-from',
    'signal-exit',
    'sucrase',
    'supports-color',
    'ts-interface-checker',
    'write-file-atomic',
  ].join(',')}}/**/*`,
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
    ignorePaths: await collectIgnorePathsAsync(projectRoot, options),
  };
}

async function collectIgnorePathsAsync(projectRoot: string, options?: Options): Promise<string[]> {
  const ignorePaths = [
    ...DEFAULT_IGNORE_PATHS,
    ...(options?.ignorePaths ?? []),
    ...(options?.dirExcludes?.map((dirExclude) => `${dirExclude}/**/*`) ?? []),
  ];

  const fingerprintIgnorePath = path.join(projectRoot, FINGERPRINT_IGNORE_FILENAME);
  try {
    const fingerprintIgnore = await fs.readFile(fingerprintIgnorePath, 'utf8');
    const fingerprintIgnoreLines = fingerprintIgnore.split('\n');
    for (const line of fingerprintIgnoreLines) {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        ignorePaths.push(trimmedLine);
      }
    }
  } catch {}

  return ignorePaths;
}
