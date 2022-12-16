import { vol } from 'memfs';
import os from 'os';
import path from 'path';

import { assertSdkRoot } from '../AndroidSdk';

jest.mock('fs', () => jest.requireActual('memfs').fs);

function setPlatform(platform: NodeJS.Platform) {
  Object.defineProperty(process, 'platform', { value: platform });
}

describe(assertSdkRoot, () => {
  const originalPlatform = process.platform;
  const originalHome = process.env.ANDROID_HOME;
  const originalSdkRoot = process.env.ANDROID_SDK_ROOT;

  beforeEach(() => {
    process.env.ANDROID_HOME = '';
    process.env.ANDROID_SDK_ROOT = '';
  });

  afterAll(() => {
    process.env.ANDROID_HOME = originalHome;
    process.env.ANDROID_SDK_ROOT = originalSdkRoot;
    setPlatform(originalPlatform);
  });

  afterEach(() => vol.reset());

  it('returns ANDROID_HOME location', () => {
    vol.fromJSON({ '/home/cooluser/Custom/Android/sdk/platform-tools/adb': '' });
    process.env.ANDROID_HOME = '/home/cooluser/Custom/Android/sdk';
    expect(assertSdkRoot()).toBe(process.env.ANDROID_HOME);
  });

  it('throws when ANDROID_HOME is invalid', () => {
    vol.fromJSON({});
    process.env.ANDROID_HOME = '/home/invalid/path/Android/sdk';
    expect(() => assertSdkRoot()).toThrow('ANDROID_HOME is set to a non-existing path');
  });

  it('returns ANDROID_SDK_ROOT location', () => {
    vol.fromJSON({ '/home/cooluser/Custom/Android/sdk/platform-tools/adb': '' });
    process.env.ANDROID_SDK_ROOT = '/home/cooluser/Custom/Android/sdk';
    expect(assertSdkRoot()).toBe(process.env.ANDROID_SDK_ROOT);
  });

  it('throws when ANDROID_SDK_ROOT is invalid', () => {
    vol.fromJSON({});
    process.env.ANDROID_SDK_ROOT = '/home/invalid/path/Android/sdk';
    expect(() => assertSdkRoot()).toThrow('ANDROID_SDK_ROOT is set to a non-existing path');
  });

  it('returns default location for macOS', () => {
    const target = path.join(os.homedir(), 'Library', 'Android', 'sdk');
    vol.fromJSON({ [path.join(target, 'file')]: 'file' });
    setPlatform('darwin');
    expect(assertSdkRoot()).toBe(target);
  });

  it('throws when default location for macOS is invalid', () => {
    vol.fromJSON({});
    setPlatform('darwin');
    expect(() => assertSdkRoot()).toThrow('Default install location not found');
  });

  it('returns default location for Linux', () => {
    const target = path.join(os.homedir(), 'Android', 'sdk');
    vol.fromJSON({ [path.join(target, 'file')]: 'file' });
    setPlatform('linux');
    expect(assertSdkRoot()).toBe(target);
  });

  it('throws when default location for Linux is invalid', () => {
    vol.fromJSON({});
    setPlatform('linux');
    expect(() => assertSdkRoot()).toThrow('Default install location not found');
  });

  it('returns default location for Windows', () => {
    const target = path.join(os.homedir(), 'AppData', 'Local', 'Android', 'Sdk');
    vol.fromJSON({ [path.join(target, 'file')]: 'file' });
    Object.defineProperty(process, 'platform', { value: 'win32' });
    expect(assertSdkRoot()).toBe(target);
  });

  it('throws when default location for Windows is invalid', () => {
    vol.fromJSON({});
    setPlatform('win32');
    expect(() => assertSdkRoot()).toThrow('Default install location not found');
  });
});
