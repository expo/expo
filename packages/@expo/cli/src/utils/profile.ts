import chalk from 'chalk';

import { env } from './env';
import * as Log from '../log';

/**
 * Wrap a method and profile the time it takes to execute the method using `EXPO_PROFILE`.
 * Works best with named functions (i.e. not arrow functions).
 *
 * @param fn function to profile.
 * @param functionName optional name of the function to display in the profile output.
 */
export function profile<IArgs extends any[], T extends (...args: IArgs) => any>(
  fn: T,
  functionName: string = fn.name
): T {
  if (!env.EXPO_PROFILE) {
    return fn;
  }

  const name = chalk.dim(`⏱  [profile] ${functionName ?? 'unknown'}`);

  return ((...args: IArgs) => {
    // Start the timer.
    Log.time(name);

    // Invoke the method.
    const results = fn(...args);

    // If non-promise then return as-is.
    if (!(results instanceof Promise)) {
      Log.timeEnd(name);
      return results;
    }

    // Otherwise await to profile after the promise resolves.
    return new Promise<Awaited<ReturnType<T>>>((resolve, reject) => {
      results.then(
        (results) => {
          resolve(results);
          Log.timeEnd(name);
        },
        (reason) => {
          reject(reason);
          Log.timeEnd(name);
        }
      );
    });
  }) as T;
}
