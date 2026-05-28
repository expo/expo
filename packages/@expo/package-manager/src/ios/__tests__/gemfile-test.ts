import spawnAsync from '@expo/spawn-async';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { mockSpawnPromise } from '../../__tests__/spawn-utils';
import { isUsingBundlerAsync } from '../gemfile';

const projectRoot = getTemporaryPath();

function getTemporaryPath() {
  return path.join(os.tmpdir(), Math.random().toString(36).substring(2));
}
function getRoot(...args: string[]) {
  return path.join(projectRoot, ...args);
}

const originalForceColor = process.env.FORCE_COLOR;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Need to reset the modules, since FORCE_COLOR is cached inside `supports-color`
  jest.resetModules();
  process.env.FORCE_COLOR = '1';
  // Hide lots of warn statements from the output
  console.warn = jest.fn();
});

afterAll(() => {
  process.env.FORCE_COLOR = originalForceColor;
  console.warn = originalConsoleWarn;
});

describe('isUsingBundlerAsync', () => {
  it(`returns false when no Gemfile exists`, async () => {
    const root = getRoot('bundler-no-gemfile');
    await fs.promises.mkdir(root, { recursive: true });
    expect(await isUsingBundlerAsync(root)).toBe(false);
  });

  it(`returns false when Gemfile does not contain cocoapods`, async () => {
    const root = getRoot('bundler-no-cocoapods');
    await fs.promises.mkdir(root, { recursive: true });
    fs.writeFileSync(path.join(root, 'Gemfile'), "gem 'fastlane'\n");
    expect(await isUsingBundlerAsync(root)).toBe(false);
  });

  it(`returns false when Gemfile has cocoapods but bundle exec pod fails`, async () => {
    const root = getRoot('bundler-pod-fails');
    await fs.promises.mkdir(root, { recursive: true });
    fs.writeFileSync(path.join(root, 'Gemfile'), "gem 'cocoapods'\n");

    jest.mocked(spawnAsync).mockImplementation(() => {
      return Promise.reject(new Error('bundle exec pod failed')) as any;
    });

    expect(await isUsingBundlerAsync(root)).toBe(false);
  });

  it(`returns true when Gemfile has cocoapods and bundle exec pod succeeds`, async () => {
    const root = getRoot('bundler-pod-ok');
    await fs.promises.mkdir(root, { recursive: true });
    fs.writeFileSync(path.join(root, 'Gemfile'), "gem 'cocoapods', '~> 1.16'\n");

    jest
      .mocked(spawnAsync)
      .mockImplementation(() => mockSpawnPromise(Promise.resolve({ stdout: '1.16.2' })));

    expect(await isUsingBundlerAsync(root)).toBe(true);
  });
});
