import basicSpawnAsync, { SpawnResult, SpawnOptions, SpawnPromise } from '@expo/spawn-async';
import chalk from 'chalk';
import { glob, GlobOptions } from 'glob';
import ora from 'ora';

import { EXPO_DIR } from './Constants';

export { SpawnResult, SpawnOptions };

/**
 * Asynchronously spawns a process with given command, args and options. Working directory is set to repo's root by default.
 */
export function spawnAsync(
  command: string,
  args: readonly string[] = [],
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
  args: readonly string[] = [],
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
): Promise<T | undefined> {
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

/**
 * Searches for files matching given glob patterns.
 */
export async function searchFilesAsync(
  rootPath: string,
  patterns: string | string[],
  options?: Omit<GlobOptions, 'withFileTypes'>
): Promise<Set<string>> {
  const files = await Promise.all(
    arrayize(patterns).map((pattern) =>
      glob(pattern, {
        cwd: rootPath,
        nodir: true,
        ...options,
      })
    )
  );
  return new Set(([] as string[]).concat(...files));
}

/**
 * Ensures the value is an array.
 */
export function arrayize<T>(value: T | T[]): T[] {
  if (Array.isArray(value)) {
    return value;
  }
  return value != null ? [value] : [];
}

/**
 * Execute `patch` command for given patch content
 */
export async function applyPatchAsync(options: {
  patchContent: string;
  cwd: string;
  reverse?: boolean;
  stripPrefixNum?: number;
}) {
  const args: string[] = [];
  if (options.stripPrefixNum != null) {
    // -pN passing to the `patch` command for striping slashed prefixes
    args.push(`-p${options.stripPrefixNum}`);
  }
  if (options.reverse) {
    args.push('-R');
  }

  const procPromise = spawnAsync('patch', args, {
    cwd: options.cwd,
  });
  procPromise.child.stdin?.write(options.patchContent);
  procPromise.child.stdin?.end();
  await procPromise;
}

export async function runWithSpinner<Result>(
  title: string,
  action: (step: ora.Ora) => Promise<Result> | Result,
  succeedText: string | null = null,
  options: ora.Options = {}
): Promise<Result> {
  const disabled = process.env.CI || process.env.EXPO_DEBUG;
  const step = ora({
    text: chalk.bold(title),
    isEnabled: !disabled,
    stream: disabled ? process.stdout : process.stderr,
    ...options,
  });

  step.start();

  try {
    const result = await action(step);

    if (step.isSpinning && succeedText) {
      step.succeed(succeedText);
    }
    return result;
  } catch (error) {
    step.fail();
    console.error(error);
    process.exit(1);
  }
}
