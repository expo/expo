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

/**
 * Expects that file exists and contains specified content (optionally)
 */
interface ExpectFileOptions {
  projectRoot: string;
  fileName?: string;
  filePath?: string;
  content?: string[];
}

export const expectFile = async ({
  projectRoot,
  fileName,
  filePath,
  content,
}: ExpectFileOptions) => {
  let fullFilePath;

  if (fileName) {
    const files = fs.readdirSync(projectRoot, { recursive: true });
    const file = files.find(
      (entry) =>
        entry.endsWith(fileName) &&
        !entry.includes('.brownfield-templates') &&
        !entry.includes('node_modules')
    );
    expect(file).toBeDefined();

    fullFilePath = path.join(projectRoot, file);
    expect(fs.existsSync(fullFilePath)).toBe(true);
  }

  if (filePath) {
    fullFilePath = path.join(projectRoot, filePath);
    expect(fs.existsSync(fullFilePath)).toBe(true);
  }

  const fileContent = fs.readFileSync(fullFilePath, 'utf-8');
  content?.forEach((pattern) => {
    expect(fileContent).toContain(pattern);
  });
};
