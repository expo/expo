import spawnAsync, { type SpawnResult } from '@expo/spawn-async';
import { SpawnOptions } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

/** The (local) binary for `create-expo` */
export const bin = require.resolve('../../build/index.js');

/** The default temporary path for all e2e tests */
export const projectRoot = getTemporaryPath();

/** Create a new temporary path for e2e tests */
export function getTemporaryPath() {
  return path.join(os.tmpdir(), Math.random().toString(36).substring(2));
}

/** Get the path within the default project root or temporary path */
export function getTestPath(...args: string[]) {
  return path.join(projectRoot, ...args);
}

/** Get the path witihin the default project root, and ensure that folder exists */
export function createTestPath(...args: string[]) {
  const testPath = getTestPath(...args);
  ensureFolderExists(path.dirname(testPath));
  return testPath;
}

/** Ensure the absolute folder path exists */
export function ensureFolderExists(folder: string) {
  fs.mkdirSync(folder, { recursive: true });
}

/** Run `create-expo` in the default project root */
export function execute(args: string[], { env = {}, cwd = projectRoot }: SpawnOptions = {}) {
  return spawnAsync('node', [bin, ...args], {
    cwd,
    env: {
      ...process.env,
      ...forcePackageManagerEnv('bun'),
      ...env,
    },
  });
}

/** Generate a fake `npm_config_user_agent` environment variable, to force `create-expo` using this package manager */
export function forcePackageManagerEnv(packageManager: string) {
  return { npm_config_user_agent: `${packageManager}/x.x.x` };
}

/** Expect the received spawn result to be ok or "passing" */
export function expectExecutePassing(spawn: SpawnResult) {
  // NOTE(cedric): this is wrapped in an `it` statement to add a custom message
  it(`Spawn result should be ok, received status: ${spawn.status}`, () => {
    expect(spawn.status).toBe(0);
  });

  return spawn;
}

/** Expect the file to exist, using proper failure message when it does not */
export function expectFileExists(projectName: string, ...filePath: string[]) {
  const targetPath = getTestPath(projectName, ...filePath);

  // NOTE(cedric): this is wrapped in an `it` statement to add a custom message
  it(`File path should exist: ${targetPath}`, () => {
    expect(fs.existsSync(targetPath)).toBe(true);
  });
}

/** Expect the file to not-exist, using proper failure message when it does not */
export function expectFileNotExists(projectName: string, ...filePath: string[]) {
  const targetPath = getTestPath(projectName, ...filePath);

  // NOTE(cedric): this is wrapped in an `it` statement to add a custom message
  it(`File path should not exist: ${targetPath}`, () => {
    expect(fs.existsSync(targetPath)).toBe(false);
  });
}
