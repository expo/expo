import { vol } from 'memfs';

import rnFixture from '../../plugins/__tests__/fixtures/react-native-project';
import { readAndroidManifestAsync } from '../Manifest';
import {
  getApplicationIdAsync,
  getPackage,
  renameJniOnDiskForType,
  renamePackageOnDiskForType,
  setPackageInAndroidManifest,
  setPackageInBuildGradle,
} from '../Package';
import { getAndroidManifestAsync } from '../Paths';

jest.mock('fs');

const EXAMPLE_BUILD_GRADLE = `
  android {
      compileSdkVersion rootProject.ext.compileSdkVersion
      buildToolsVersion rootProject.ext.buildToolsVersion
  
      defaultConfig {
          applicationId "com.helloworld"
          minSdkVersion rootProject.ext.minSdkVersion
          targetSdkVersion rootProject.ext.targetSdkVersion
          versionCode 1
          versionName "1.0"
      }
  }
  `;

describe('package', () => {
  afterAll(async () => {
    vol.reset();
  });
  it(`returns null if no package is provided`, () => {
    expect(getPackage({})).toBe(null);
  });

  it(`returns the package if provided`, () => {
    expect(getPackage({ android: { package: 'com.example.xyz' } })).toBe('com.example.xyz');
  });

  it(`returns the applicationId defined in build.gradle`, () => {
    const projectRoot = '/';
    vol.fromJSON(rnFixture, projectRoot);

    expect(getApplicationIdAsync(projectRoot)).resolves.toBe('com.bacon.mydevicefamilyproject');
  });

  it(`sets the applicationId in build.gradle if package is given`, () => {
    expect(
      setPackageInBuildGradle({ android: { package: 'my.new.app' } }, EXAMPLE_BUILD_GRADLE)
    ).toMatch("applicationId 'my.new.app'");
  });

  it('adds package to android manifest', async () => {
    const projectRoot = '/';
    vol.fromJSON(rnFixture, projectRoot);

    let androidManifestJson = await readAndroidManifestAsync(
      await getAndroidManifestAsync(projectRoot)
    );
    androidManifestJson = await setPackageInAndroidManifest(
      { android: { package: 'com.test.package' } },
      androidManifestJson
    );

    expect(androidManifestJson.manifest.$.package).toMatch('com.test.package');
  });
});

describe(renamePackageOnDiskForType, () => {
  afterAll(async () => {
    vol.reset();
  });
  it(`refactors a main project`, async () => {
    const projectRoot = '/';
    vol.fromJSON(rnFixture, projectRoot);

    // Ensure the path that will be deleted exists before we
    // delete it, this helps prevent the test from accidentally breaking.
    const originalPath = '/android/app/src/main/java/com/reactnativeproject/MainActivity.java';

    expect(vol.toJSON()[originalPath]).toBeDefined();
    await renamePackageOnDiskForType({
      projectRoot,
      type: 'main',
      packageName: 'com.bacon.foobar',
    });

    const results = vol.toJSON();
    // Ensure the file exists in the new location with the new package name
    expect(results['/android/app/src/main/java/com/bacon/foobar/MainActivity.java']).toMatch(
      /^package com.bacon.foobar;/
    );
    expect(results[originalPath]).toBeUndefined();
    // Ensure the BUCK file is rewritten
    expect(results['/android/app/BUCK']).toMatch(/package = "com.bacon.foobar"/);
  });
  it(`refactors a debug project`, async () => {
    const projectRoot = '/';
    vol.fromJSON(rnFixture, projectRoot);
    await renamePackageOnDiskForType({
      projectRoot,
      type: 'debug',
      packageName: 'com.bacon.foobar',
    });

    const results = vol.toJSON();
    expect(results['/android/app/src/debug/java/com/bacon/foobar/ReactNativeFlipper.java']).toMatch(
      /package com.bacon.foobar;/
    );
  });
});

describe(renameJniOnDiskForType, () => {
  afterAll(async () => {
    vol.reset();
  });
  it(`refactors a main project`, async () => {
    const projectRoot = '/';
    vol.fromJSON(rnFixture, projectRoot);

    await renameJniOnDiskForType({
      projectRoot,
      type: 'main',
      packageName: 'com.bacon.foobar',
    });

    const results = vol.toJSON();
    expect(
      results['/android/app/src/main/jni/MainApplicationTurboModuleManagerDelegate.h']
    ).toMatch(
      /"Lcom\/bacon\/foobar\/newarchitecture\/modules\/MainApplicationTurboModuleManagerDelegate;";/
    );
  });
});
