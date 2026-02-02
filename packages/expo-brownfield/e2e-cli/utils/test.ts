import fs from 'fs';
import path from 'path';

import { executeCLIASync } from './process';

type ExpectedStreamValue =
  | string // Validate that output includes expected string
  | string[] // Validate that output includes expected strings
  | Set<string>; // Validate that output excludes all strings from the set

interface BuildTestOptions {
  directory: string;
  command: string;
  args?: string[];
  successExit?: boolean;
  stdout?: ExpectedStreamValue;
  stderr?: ExpectedStreamValue;
  useSnapshot?: boolean;
}

type BuildTestOptionsPlatform = Omit<BuildTestOptions, 'command'>;

/**
 * Runs a build:android test scenario and validates results
 */
export const buildAndroidTest = async ({
  directory,
  args,
  successExit,
  stdout,
  stderr,
  useSnapshot,
}: BuildTestOptionsPlatform) => {
  await buildTestCommon({
    directory,
    command: 'build:android',
    args,
    successExit,
    stdout,
    stderr,
    useSnapshot,
  });
};

/**
 * Runs a build:ios test scenario and validates results
 */
export const buildIosTest = async ({
  directory,
  args,
  successExit,
  stdout,
  stderr,
  useSnapshot,
}: BuildTestOptionsPlatform) => {
  await buildTestCommon({
    directory,
    command: 'build:ios',
    args,
    successExit,
    stdout,
    stderr,
    useSnapshot,
  });
};

/**
 * Runs a tasks:android test scenario and validates results
 */
export const tasksAndroidTest = async ({
  directory,
  args,
  successExit,
  stdout,
  stderr,
  useSnapshot,
}: BuildTestOptionsPlatform) => {
  await buildTestCommon({
    directory,
    command: 'tasks:android',
    args,
    successExit,
    stdout,
    stderr,
    useSnapshot,
  });
};

/**
 * Common logic for build:android, build:ios and tasks:android tests
 */
export const buildTestCommon = async ({
  directory,
  command,
  args = [],
  successExit = true,
  stdout = [],
  stderr = [],
  useSnapshot = false,
}: BuildTestOptions) => {
  const result = await executeCLIASync(directory, [command, ...args], {
    ignoreErrors: !successExit,
  });

  if (successExit) {
    expect(result.exitCode).toBe(0);
  } else {
    expect(result.exitCode).not.toBe(0);
  }

  if (useSnapshot) {
    expect(result.stdout).toMatchSnapshot();
  }

  if (stdout) {
    if (typeof stdout === 'string') {
      expect(result.stdout).toContain(stdout);
    } else if (Array.isArray(stdout)) {
      stdout.forEach((line) => {
        expect(result.stdout).toContain(line);
      });
    } else if (stdout instanceof Set) {
      stdout.forEach((line) => {
        expect(result.stdout).not.toContain(line);
      });
    }
  }

  if (stderr) {
    if (typeof stderr === 'string') {
      expect(result.stderr).toContain(stderr);
    } else if (Array.isArray(stderr)) {
      stderr.forEach((line) => {
        expect(result.stderr).toContain(line);
      });
    } else if (stderr instanceof Set) {
      stderr.forEach((line) => {
        expect(result.stderr).not.toContain(line);
      });
    }
  }
};

/**
 * Expects the prebuild to be successful at the given project root and platform
 */
export const expectPrebuild = async (projectRoot: string, platform: 'android' | 'ios') => {
  const prebuildDir = path.join(projectRoot, platform);
  expect(fs.existsSync(prebuildDir)).toBe(true);

  const prebuildFiles = fs.readdirSync(prebuildDir, { recursive: true });
  expect(prebuildFiles.length).toBeGreaterThan(0);
};
