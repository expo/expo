import chalk from 'chalk';

import * as Log from '../Log';

/**
 * Wrap a method and profile the time it takes to execute the method using `EXPO_PROFILE`.
 * Works best with named functions (i.e. not arrow functions).
 *
 * @param fn function to profile.
 * @param functionName optional name of the function to display in the profile output.
 */
export const profile = <T extends any[], U>(
  fn: (...args: T) => U,
  functionName: string = fn.name
): ((...args: T) => U) => {
  const name = chalk.dim(`⏱  [profile] ${functionName ?? 'unknown'}`);
  return (...args: T): U => {
    Log.time(name);
    const results = fn(...args);
    if (results instanceof Promise) {
      // @ts-ignore: Type 'Promise<U>' is not assignable to type 'U'. 'U' could be instantiated with an arbitrary type which could be unrelated to 'Promise<U>'.
      return new Promise<U>((resolve, reject) => {
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
    } else {
      Log.timeEnd(name);
    }
    return results;
  };
};
