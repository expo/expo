import fs from 'fs';
import os from 'os';
import path from 'path';

import { resolveSetupAppleSpmScript } from '../swiftpm';

describe(resolveSetupAppleSpmScript, () => {
  let projectRoot: string;
  let reactNativeDir: string;

  beforeEach(() => {
    projectRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'create-expo-swiftpm-')));
    reactNativeDir = path.join(projectRoot, 'node_modules', 'react-native');
  });
  afterEach(() => {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  });

  it(`returns the script inside the project's react-native package`, () => {
    fs.mkdirSync(path.join(reactNativeDir, 'scripts'), { recursive: true });
    fs.writeFileSync(path.join(reactNativeDir, 'package.json'), '{"name":"react-native"}');
    fs.writeFileSync(path.join(reactNativeDir, 'scripts', 'setup-apple-spm.js'), '');

    expect(resolveSetupAppleSpmScript(projectRoot)).toBe(
      path.join(reactNativeDir, 'scripts', 'setup-apple-spm.js')
    );
  });

  it(`returns null when react-native does not ship the script`, () => {
    fs.mkdirSync(reactNativeDir, { recursive: true });
    fs.writeFileSync(path.join(reactNativeDir, 'package.json'), '{"name":"react-native"}');

    expect(resolveSetupAppleSpmScript(projectRoot)).toBeNull();
  });

  // Jest's resolver falls back to the monorepo's node_modules, so a fixture without
  // react-native still resolves one; inject a resolver that fails like Node's does.
  it(`returns null when react-native is not installed`, () => {
    fs.writeFileSync(path.join(projectRoot, 'package.json'), '{}');
    const resolve = jest.fn((moduleId: string): string => {
      throw new Error(`Cannot find module '${moduleId}'`);
    });

    expect(resolveSetupAppleSpmScript(projectRoot, resolve)).toBeNull();
    expect(resolve).toHaveBeenCalledWith('react-native/package.json');
  });
});
