import os from 'os';

import type { NormalizedOptions, Options } from './Fingerprint.types';

export function normalizeOptions(options?: Options): NormalizedOptions {
  return {
    ...options,
    platforms: options?.platforms ?? ['android', 'ios'],
    concurrentIoLimit: options?.concurrentIoLimit ?? os.cpus().length,
    hashAlgorithm: options?.hashAlgorithm ?? 'sha1',
    dirExcludes: options?.dirExcludes ?? [
      '**/android/build',
      '**/android/app/build',
      '**/android/app/.cxx',
      'ios/Pods',
    ],
  };
}
