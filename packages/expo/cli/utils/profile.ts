import chalk from 'chalk';

import * as Log from '../Log';

/**
 * Wrap a method and profile the time it takes to execute the method using `EXPO_PROFILE`.
 * Works best with named functions (i.e. not arrow functions).
 *
 * @param fn
 * @param functionName
 */
export const profile = <T extends any[], U>(fn: (...args: T) => U, functionName?: string) => {
  const name = chalk.dim(`⏱  [profile] ${functionName ?? (fn.name || 'unknown')}`);
  return (...args: T): U => {
    Log.time(name);
    const results = fn(...args);
    if (results instanceof Promise) {
      // @ts-ignore
      return new Promise<U>((resolve, reject) => {
        results
          .then((results) => {
            resolve(results);
            Log.timeEnd(name);
          })
          .catch((error) => {
            reject(error);
            Log.timeEnd(name);
          });
      });
    } else {
      Log.timeEnd(name);
    }
    return results;
  };
};
