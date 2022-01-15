/* eslint-env jest */
import execa from 'execa';
import os from 'os';
import path from 'path';

export const bin = require.resolve('../../build-cli/bin/cli');

export const projectRoot = getTemporaryPath();

export function getTemporaryPath() {
  return path.join(os.tmpdir(), Math.random().toString(36).substring(2));
}

export function execute(...args) {
  return execa('node', [bin, ...args], { cwd: projectRoot });
}

export function getRoot(...args) {
  return path.join(projectRoot, ...args);
}
