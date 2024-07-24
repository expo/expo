import chalk from 'chalk';

import type { NormalizedOptions } from '../Fingerprint.types';

/**
 * Wrap a method and profile the time it takes to execute the method using `EXPO_PROFILE`.
 * Works best with named functions (i.e. not arrow functions).
 *
 * @param fn function to profile.
 * @param functionName optional name of the function to display in the profile output.
 */
export function profile<IArgs extends any[], T extends (...args: IArgs) => any>(
  options: NormalizedOptions,
  fn: T,
  functionName: string = fn.name
): T {
  if (!process.env['DEBUG'] || options.silent) {
    return fn;
  }

  const name = chalk.dim(`⏱  [profile] ${functionName ?? 'unknown'}`);

  return ((...args: IArgs) => {
    // Start the timer.
    console.time(name);

    // Invoke the method.
    const results = fn(...args);

    // If non-promise then return as-is.
    if (!(results instanceof Promise)) {
      console.timeEnd(name);
      return results;
    }

    // Otherwise await to profile after the promise resolves.
    return new Promise<Awaited<ReturnType<T>>>((resolve, reject) => {
      results.then(
        (results) => {
          resolve(results);
          console.timeEnd(name);
        },
        (reason) => {
          reject(reason);
          console.timeEnd(name);
        }
      );
    });
  }) as T;
}
