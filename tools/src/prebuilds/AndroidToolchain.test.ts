import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';

import {
  findAndroidSdkInstaller,
  findSdkManager,
  parseAndroidToolchainVersions,
} from './AndroidToolchain';

describe('AndroidToolchain', () => {
  it('reads the Android toolchain from the React Native version catalog', () => {
    assert.deepEqual(
      parseAndroidToolchainVersions(`
[versions]
compileSdk = "37"
buildTools = "37.0.0"
ndkVersion = "27.1.12297006"
      `),
      {
        buildTools: '37.0.0',
        compileSdk: '37',
        ndkVersion: '27.1.12297006',
      }
    );
  });

  it('fails when a required version is absent', () => {
    assert.throws(
      () => parseAndroidToolchainVersions('compileSdk = "37"'),
      /does not define buildTools/
    );
  });

  it('finds sdkmanager below the configured SDK before PATH', () => {
    const sdkRoot = path.join(path.sep, 'android-sdk');
    const expected = path.join(sdkRoot, 'cmdline-tools', 'latest', 'bin', 'sdkmanager');
    assert.equal(
      findSdkManager(
        { ANDROID_HOME: sdkRoot, PATH: path.join(path.sep, 'bin') },
        (candidate) => candidate === expected
      ),
      expected
    );
  });

  it('falls back to sdkmanager on PATH', () => {
    const bin = path.join(path.sep, 'custom-bin');
    const expected = path.join(bin, 'sdkmanager');
    assert.equal(
      findSdkManager({ PATH: bin }, (candidate) => candidate === expected),
      expected
    );
  });

  it('uses the modern Android CLI when sdkmanager is unavailable', () => {
    const bin = path.join(path.sep, 'custom-bin');
    const expected = path.join(bin, 'android');
    const installer = findAndroidSdkInstaller({ PATH: bin }, (candidate) => candidate === expected);
    assert.equal(installer.command, expected);
    assert.deepEqual(installer.installArgs(['platforms;android-37', 'ndk;27.1']), [
      'sdk',
      'install',
      'platforms/android-37',
      'ndk/27.1',
    ]);
  });

  it('uses sdkmanager syntax when the modern Android CLI is unavailable', () => {
    const bin = path.join(path.sep, 'custom-bin');
    const expected = path.join(bin, 'sdkmanager');
    const installer = findAndroidSdkInstaller({ PATH: bin }, (candidate) => candidate === expected);
    assert.equal(installer.command, expected);
    assert.deepEqual(installer.installArgs(['ndk;27.1']), ['--install', 'ndk;27.1']);
  });

  it('prefers sdkmanager over a legacy executable named android', () => {
    const sdkRoot = path.join(path.sep, 'android-sdk');
    const sdkManager = path.join(sdkRoot, 'tools', 'bin', 'sdkmanager');
    const legacyAndroid = path.join(sdkRoot, 'tools', 'android');
    const installer = findAndroidSdkInstaller(
      { ANDROID_HOME: sdkRoot, PATH: path.dirname(legacyAndroid) },
      (candidate) => candidate === sdkManager || candidate === legacyAndroid
    );
    assert.equal(installer.command, sdkManager);
    assert.deepEqual(installer.installArgs(['ndk;27.1']), ['--install', 'ndk;27.1']);
  });
});
