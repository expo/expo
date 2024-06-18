import { glob, globStream, type GlobOptions } from 'glob';

/** Finds all matching files. */
export function everyMatchAsync(pattern: string, options: Omit<GlobOptions, 'withFileTypes'> = {}) {
  return glob(pattern, options);
}

/**
 * Bails out early after finding the first matching file.
 * @see https://github.com/isaacs/node-glob/issues/279#issuecomment-1449072609
 */
export function anyMatchAsync(
  pattern: string,
  options: Omit<GlobOptions, 'withFileTypes' | 'signal'> = {}
) {
  return new Promise<string[]>((resolve, reject) => {
    const controller = new AbortController();

    globStream(pattern, { ...options, signal: controller.signal })
      .on('error', (error: any) => {
        if (!controller.signal.aborted) {
          reject(error);
        }
      })
      .once('end', () => resolve([]))
      .once('data', (match: string) => {
        resolve([match]);
        controller.abort();
      });
  });
}
