import fs from 'fs';
import path from 'path';

import { executeCLIASync } from './process';

/**
 * Runs a build-android test scenario and validates results
 */
export const buildAndroidTest = async (
  directory: string,
  args: string[],
  successExit: boolean,
  stdout: string[] = [],
  stderr: string[] = []
) => {
  await buildTestCommon(directory, 'build-android', args, successExit, stdout, stderr);
};

/**
 * Runs a build-ios test scenario and validates results
 */
export const buildIosTest = async (
  directory: string,
  args: string[],
  successExit: boolean,
  stdout: string[] = [],
  stderr: string[] = []
) => {
  await buildTestCommon(directory, 'build-ios', args, successExit, stdout, stderr);
};

/**
 * Common logic for build-android and build-ios tests
 */
export const buildTestCommon = async (
  directory: string,
  command: string,
  args: string[],
  successExit: boolean,
  stdout: string[] = [],
  stderr: string[] = []
) => {
  const result = await executeCLIASync(directory, [command, ...args], {
    ignoreErrors: !successExit,
  });

  if (successExit) {
    expect(result.exitCode).toBe(0);
  } else {
    expect(result.exitCode).not.toBe(0);
  }

  for (const line of stdout) {
    expect(result.stdout).toContain(line);
  }
  for (const line of stderr) {
    expect(result.stderr).toContain(line);
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
