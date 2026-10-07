import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { assertSupportedLocalSdk, getLocalSdkMajorVersion } from '../localSdk';
import { UserError } from '../utils/errors';

describe(getLocalSdkMajorVersion, () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'local-sdk-'));
  });

  afterEach(async () => {
    await fs.promises.rm(root, { recursive: true, force: true });
  });

  async function installExpo(directory: string, packageJson: string) {
    const expoDir = path.join(directory, 'node_modules', 'expo');
    await fs.promises.mkdir(expoDir, { recursive: true });
    await fs.promises.writeFile(path.join(expoDir, 'package.json'), packageJson);
    return path.join(expoDir, 'package.json');
  }

  it('returns the major version of the nearest installation above the directory', async () => {
    await installExpo(root, '{"version":"57.0.0"}');
    const app = path.join(root, 'apps', 'app');
    await installExpo(app, '{"version":"56.0.3"}');
    const moduleDir = path.join(app, 'modules', 'my-module');
    await fs.promises.mkdir(moduleDir, { recursive: true });

    expect(getLocalSdkMajorVersion(moduleDir)).toBe(56);
  });

  it.each([
    ['Expo is not installed', null],
    ['a node_modules path is a file', 'file'],
    ['the version has no numeric major', '{"version":"unknown.0.0"}'],
  ])('returns null when %s', async (_label, packageJson) => {
    if (packageJson === 'file') {
      await fs.promises.writeFile(path.join(root, 'node_modules'), '');
    } else if (packageJson) {
      await installExpo(root, packageJson);
    }
    expect(getLocalSdkMajorVersion(root)).toBeNull();
  });

  it('reports an unreadable expo package.json as a user error', async () => {
    const packagePath = await installExpo(root, '{invalid');

    expect(() => getLocalSdkMajorVersion(root)).toThrow(UserError);
    expect(() => getLocalSdkMajorVersion(root)).toThrow(
      `Couldn't read the Expo SDK version from ${packagePath}`
    );
  });
});

describe(assertSupportedLocalSdk, () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([56, null])('allows SDK %p', (sdkVersion) => {
    expect(() => assertSupportedLocalSdk(sdkVersion)).not.toThrow();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it.each([true, false])('rejects an older SDK (suggest older CLI: %p)', (suggestOlderCli) => {
    let error: unknown;
    try {
      assertSupportedLocalSdk(55, false, suggestOlderCli);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(UserError);
    const { message } = error as UserError;
    expect(message).toContain('does not support local modules in Expo SDK 55');
    expect(message).toContain('re-run the command with --ignore-compatibility-check');
    expect(message.includes('npx create-expo-module@sdk-55 --local')).toBe(suggestOlderCli);
  });

  it('warns instead of rejecting an older SDK when the check is ignored', () => {
    expect(() => assertSupportedLocalSdk(55, true)).not.toThrow();
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Expo SDK 55'));
  });
});
