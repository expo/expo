import spawnAsync, { SpawnOptions, SpawnResult } from '@expo/spawn-async';
import { spawnSync } from 'child_process';
import { join } from 'path';

export const AUTOLINKINNG_CLI = join(__dirname, '../bin/expo-modules-autolinking.js');

function isSpawnResult(errorOrResult: Error): errorOrResult is Error & SpawnResult {
  return 'pid' in errorOrResult && 'stdout' in errorOrResult && 'stderr' in errorOrResult;
}

export async function autolinkingRunAsync(
  args: string[],
  options?: SpawnOptions
): Promise<SpawnResult> {
  const promise = spawnAsync(AUTOLINKINNG_CLI, args, {
    ...options,
    env: { ...process.env, EXPO_SHOULD_USE_LEGACY_PACKAGE_INTERFACE: '1' },
  });

  try {
    return await promise;
  } catch (error) {
    if (isSpawnResult(error)) {
      if (error.stdout) error.message += `\n------\nSTDOUT:\n${error.stdout}`;
      if (error.stderr) error.message += `\n------\nSTDERR:\n${error.stderr}`;
    }
    throw error;
  }
}

// For some reason, it can't be async, cause otherwise we will get `yarn did not print valid JSON:` error
export function yarnSync(options?: SpawnOptions) {
  const result = spawnSync('yarn', ['install', '--silent'], { encoding: 'utf8', ...options });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(
      `yarn install exited with ${result.status ?? result.signal}\n------\nSTDOUT:\n${result.stdout}\n------\nSTDERR:\n${result.stderr}`
    );
  }
}

export function combinations<T, U>(
  aKey: string,
  a: T[],
  bKey: string,
  b: U[]
): { [key: string]: T | U }[] {
  const result = [];
  a.forEach((aValue) => {
    b.forEach((bValue) => {
      result.push({
        [aKey]: aValue,
        [bKey]: bValue,
      });
    });
  });

  return result;
}
