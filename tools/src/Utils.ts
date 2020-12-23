import fs from 'fs-extra';
import chalk from 'chalk';
import basicSpawnAsync, { SpawnResult, SpawnOptions, SpawnPromise } from '@expo/spawn-async';

import { EXPO_DIR } from './Constants';

export { SpawnResult, SpawnOptions };

/**
 * Asynchronously spawns a process with given command, args and options. Working directory is set to repo's root by default.
 */
export function spawnAsync(
  command: string,
  args: Readonly<string[]> = [],
  options: SpawnOptions = {}
): SpawnPromise<SpawnResult> {
  return basicSpawnAsync(command, args, {
    env: { ...process.env },
    cwd: EXPO_DIR,
    ...options,
  });
}

/**
 * Does the same as `spawnAsync` but parses the output to JSON object.
 */
export async function spawnJSONCommandAsync<T = object>(
  command: string,
  args: Readonly<string[]> = [],
  options: SpawnOptions = {}
): Promise<T> {
  const child = await spawnAsync(command, args, options);
  try {
    return JSON.parse(child.stdout);
  } catch (e) {
    e.message +=
      '\n' + chalk.red('Cannot parse this output as JSON: ') + chalk.yellow(child.stdout.trim());
    throw e;
  }
}

/**
 * Deeply clones an object. It's used to make a backup of home's `app.json` file.
 */
export function deepCloneObject<ObjectType extends object = object>(
  object: ObjectType
): ObjectType {
  return JSON.parse(JSON.stringify(object));
}

/**
 * Type of allowed transform rules used by `transformFileAsync`.
 */
export type FileTransformRule = {
  pattern: string | RegExp;
  replaceWith: string | ((substring: string, ...args: any[]) => string);
};

/**
 * Handy method transforming file's content according to given transform rules.
 */
export async function transformFileAsync(
  filePath: string,
  transforms: FileTransformRule[]
): Promise<void> {
  fs.access(filePath, fs.constants.R_OK | fs.constants.W_OK);

  const fileContent = transforms.reduce(
    // @ts-ignore @tsapeta: I don't really know why, but TS gets crazy on `replaceWith`.
    (acc, transform) => acc.replace(transform.pattern, transform.replaceWith),
    await fs.readFile(filePath, 'utf8')
  );

  await fs.writeFile(filePath, fileContent);
}

/**
 * Waits given amount of time (in milliseconds).
 */
export function sleepAsync(duration: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}

/**
 * Filters an array asynchronously.
 */
export async function filterAsync<T = any>(
  arr: T[],
  filter: (item: T, index: number) => boolean | Promise<boolean>
): Promise<T[]> {
  const results = await Promise.all(arr.map(filter));
  return arr.filter((item, index) => results[index]);
}

/**
 * Retries executing the function with given interval and with given retry limit.
 * It resolves immediately once the callback returns anything else than `undefined`.
 */
export async function retryAsync<T = any>(
  interval: number,
  limit: number,
  callback: () => T | Promise<T>
): Promise<T> {
  return new Promise((resolve) => {
    let count = 0;

    const timeoutCallback = async () => {
      const result = await callback();

      if (result !== undefined) {
        resolve(result);
        return;
      }
      if (++count < limit) {
        setTimeout(timeoutCallback, interval);
      } else {
        resolve(undefined);
      }
    };
    timeoutCallback();
  });
}

/**
 * Executes regular expression against a string until the last match is found.
 */
export function execAll(rgx: RegExp, str: string, index: number = 0): string[] {
  const globalRgx = new RegExp(rgx.source, 'g' + rgx.flags.replace('g', ''));
  const matches: string[] = [];
  let match;
  while ((match = globalRgx.exec(str))) {
    matches.push(match[index]);
  }
  return matches;
}
