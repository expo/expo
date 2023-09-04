import os from 'os';

import type { NormalizedOptions, Options } from './Fingerprint.types';

export const DEFAULT_IGNORES = [
  '**/android/build/**/*',
  '**/android/app/build/**/*',
  '**/android/app/.cxx/**/*',
  '**/ios/Pods/**/*',
];

export function normalizeOptions(options?: Options): NormalizedOptions {
  const ignores = [
    ...DEFAULT_IGNORES,
    ...(options?.ignores ?? []),
    ...(options?.dirExcludes?.map((dirExclude) => `${dirExclude}/**/*`) ?? []),
  ];
  return {
    ...options,
    platforms: options?.platforms ?? ['android', 'ios'],
    concurrentIoLimit: options?.concurrentIoLimit ?? os.cpus().length,
    hashAlgorithm: options?.hashAlgorithm ?? 'sha1',
    ignores,
  };
}
