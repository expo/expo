import type { SpawnResult, SpawnOptions } from '@expo/spawn-async';
import spawnAsync from '@expo/spawn-async';
import fs from 'fs';
import os from 'os';
import path from 'path';

/** The (local) binary for `create-expo-module` */
export const bin = require.resolve('../../build/index.js');

/** The default temporary path for all e2e tests */
export const projectRoot = getTemporaryPath();

/** Create a new temporary path for e2e tests */
export function getTemporaryPath() {
  return path.join(os.tmpdir(), 'create-expo-module-e2e-' + Math.random().toString(36).substring(2));
}

/** Get the path within the default project root or temporary path */
export function getTestPath(...args: string[]) {
  return path.join(projectRoot, ...args);
}

/** Get the path witihin the default project root, and ensure that folder exists */
export function createTestPath(...args: string[]) {
  const testPath = getTestPath(...args);
  ensureFolderExists(testPath);
  return testPath;
}

/** Ensure the absolute folder path exists */
export function ensureFolderExists(folder: string) {
  fs.mkdirSync(folder, { recursive: true });
}

/** Run `create-expo-module` asynchronously, with default settings for CI */
export function execute(args: string[], { env = {}, cwd = projectRoot }: SpawnOptions = {}) {
  const cwdPath = typeof cwd === 'string' ? cwd : cwd?.toString() ?? projectRoot;
  return spawnAsync('node', [bin, ...args], {
    cwd: cwdPath,
    env: {
      ...process.env,
      // Force non-interactive mode for CI
      CI: '1',
      // Disable telemetry
      EXPO_NO_TELEMETRY: '1',
      // Set INIT_CWD to ensure the CLI uses the correct working directory
      // (the CLI checks INIT_CWD first before process.cwd())
      INIT_CWD: cwdPath,
      ...env,
    },
  });
}

/** Run `create-expo-module` asynchronously, with default settings, and validate the status is `0` */
export async function executePassing(args: string[], options?: SpawnOptions) {
  let result: SpawnResult | null = null;

  try {
    result = await execute(args, options);
  } catch (error: any) {
    result = error;
  }

  return expectExecutePassing(result!);
}

/** Expect the received spawn result to be ok or "passing" */
export function expectExecutePassing(spawn: SpawnResult) {
  // Copy the spawn result, that could be an error, and force Jest to list out stdout/stderr when status is not 0
  expect({ status: spawn.status, stdout: spawn.stdout, stderr: spawn.stderr }).toEqual(
    expect.objectContaining({
      status: 0,
      stdout: expect.any(String),
      stderr: expect.any(String),
    })
  );
  return spawn;
}

/** Expect the file to exist, using proper failure message when it does not */
export function expectFileExists(projectName: string, ...filePath: string[]) {
  const targetPath = getTestPath(projectName, ...filePath);
  // Force Jest to list the path when it does not exist
  expect({ [targetPath]: fs.existsSync(targetPath) }).toEqual({ [targetPath]: true });
}

/** Expect the file to not-exist, using proper failure message when it does not */
export function expectFileNotExists(projectName: string, ...filePath: string[]) {
  const targetPath = getTestPath(projectName, ...filePath);
  // Force Jest to list the path when it does exist
  expect({ [targetPath]: fs.existsSync(targetPath) }).toEqual({ [targetPath]: false });
}

/** Read and parse a JSON file from the test project */
export function readJson(projectName: string, ...filePath: string[]) {
  const targetPath = getTestPath(projectName, ...filePath);
  return JSON.parse(fs.readFileSync(targetPath, { encoding: 'utf8' }));
}

