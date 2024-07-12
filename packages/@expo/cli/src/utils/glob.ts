import { glob, globStream, type GlobOptions } from 'glob';

/**
 * Finds all matching files.
 * @deprecated Use `glob` directly instead.
 */
export const everyMatchAsync: typeof glob = glob;

/** Bails out early after finding the first matching file. */
export function anyMatchAsync(
  pattern: string,
  options: Omit<GlobOptions, 'withFileTypes' | 'signal'>
) {
  return new Promise<string[]>((resolve, reject) => {
    const controller = new AbortController();

    globStream(pattern, { ...options, signal: controller.signal })
      .on('error', (error) => {
        if (!controller.signal.aborted) {
          reject(error);
        }
      })
      .once('end', () => resolve([]))
      .once('data', (file) => {
        controller.abort();
        resolve([file]);
      });
  });
}
