import { vol } from 'memfs';
import os from 'os';
import path from 'path';

import { resolveSdkRoot } from '../android/AndroidSdk';

jest.mock('fs', () => jest.requireActual('memfs').fs);

describe(resolveSdkRoot, () => {
  const originalPlatform = process.platform;
  const originalHome = process.env.ANDROID_HOME;
  const originalSdkRoot = process.env.ANDROID_SDK_ROOT;

  beforeEach(() => {
    process.env.ANDROID_HOME = null;
    process.env.ANDROID_SDK_ROOT = null;
  });

  afterAll(() => {
    process.env.ANDROID_HOME = originalHome;
    process.env.ANDROID_SDK_ROOT = originalSdkRoot;
    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  afterEach(() => vol.reset());

  it('returns ANDROID_HOME location', () => {
    vol.fromJSON({ '/home/cooluser/Custom/Android/sdk/platform-tools/adb': '' });
    process.env.ANDROID_HOME = '/home/cooluser/Custom/Android/sdk';
    process.env.ANDROID_SDK_ROOT = 'invalid';
    expect(resolveSdkRoot()).toBe(process.env.ANDROID_HOME);
  });

  it('returns ANDROID_SDK_ROOT location', () => {
    vol.fromJSON({ '/home/cooluser/Custom/Android/sdk/platform-tools/adb': '' });
    process.env.ANDROID_HOME = 'invalid';
    process.env.ANDROID_SDK_ROOT = '/home/cooluser/Custom/Android/sdk';
    expect(resolveSdkRoot()).toBe(process.env.ANDROID_SDK_ROOT);
  });

  it('returns default location for macOS', () => {
    const target = path.join(os.homedir(), 'Library', 'Android', 'sdk');
    vol.fromJSON({ [path.join(target, 'file')]: 'file' });
    Object.defineProperty(process, 'platform', { value: 'darwin' });
    expect(resolveSdkRoot()).toBe(target);
  });

  it('returns default location for Linux', () => {
    const target = path.join(os.homedir(), 'Android', 'sdk');
    vol.fromJSON({ [path.join(target, 'file')]: 'file' });
    Object.defineProperty(process, 'platform', { value: 'linux' });
    expect(resolveSdkRoot()).toBe(target);
  });

  it('returns default location for Windows', () => {
    const target = path.join(os.homedir(), 'AppData', 'Local', 'Android', 'Sdk');
    vol.fromJSON({ [path.join(target, 'file')]: 'file' });
    Object.defineProperty(process, 'platform', { value: 'win32' });
    expect(resolveSdkRoot()).toBe(target);
  });
});
