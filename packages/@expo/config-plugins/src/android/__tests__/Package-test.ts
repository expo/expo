import { vol } from 'memfs';

import rnFixture from '../../plugins/__tests__/fixtures/react-native-project';
import {
  getApplicationIdAsync,
  getPackage,
  kotlinSanitized,
  renameJniOnDiskForType,
  renamePackageOnDiskForType,
  setPackageInBuildGradle,
} from '../Package';

jest.mock('fs');

const EXAMPLE_BUILD_GRADLE = `
  android {
      compileSdkVersion rootProject.ext.compileSdkVersion
      buildToolsVersion rootProject.ext.buildToolsVersion

      namespace "com.helloworld"
      defaultConfig {
          applicationId "com.helloworld"
          minSdkVersion rootProject.ext.minSdkVersion
          targetSdkVersion rootProject.ext.targetSdkVersion
          versionCode 1
          versionName "1.0"
      }
  }
  `;

const EXAMPLE_BUILD_GRADLE_ASSIGNMENT_FORM = `
  android {
      compileSdkVersion rootProject.ext.compileSdkVersion
      buildToolsVersion rootProject.ext.buildToolsVersion

      namespace = "com.helloworld"
      defaultConfig {
          applicationId = "com.helloworld"
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

  describe.each([
    ['method-call', EXAMPLE_BUILD_GRADLE, ' '],
    ['assignment', EXAMPLE_BUILD_GRADLE_ASSIGNMENT_FORM, ' = '],
  ])(`with Gradle %s syntax`, (_syntax, buildGradle, separator) => {
    it(`returns the applicationId defined in build.gradle`, async () => {
      const projectRoot = '/';
      vol.fromJSON({ 'android/app/build.gradle': buildGradle }, projectRoot);

      await expect(getApplicationIdAsync(projectRoot)).resolves.toBe('com.helloworld');
    });

    it(`sets the applicationId in build.gradle if package is given`, () => {
      expect(setPackageInBuildGradle({ android: { package: 'my.new.app' } }, buildGradle)).toMatch(
        `applicationId${separator}'my.new.app'`
      );
    });

    it(`sets the namespace in build.gradle if package is given`, () => {
      expect(setPackageInBuildGradle({ android: { package: 'my.new.app' } }, buildGradle)).toMatch(
        `namespace${separator}'my.new.app'`
      );
    });
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
    const originalPath = '/android/app/src/main/java/com/helloworld/MainActivity.kt';

    expect(vol.toJSON()[originalPath]).toBeDefined();
    await renamePackageOnDiskForType({
      projectRoot,
      type: 'main',
      packageName: 'com.bacon.foobar',
    });

    const results = vol.toJSON();
    // Ensure the file exists in the new location with the new package name
    expect(results['/android/app/src/main/java/com/bacon/foobar/MainActivity.kt']).toMatch(
      /^package com.bacon.foobar/
    );
    expect(results[originalPath]).toBeUndefined();
    // Ensure the BUCK file is rewritten
    // expect(results['/android/app/BUCK']).toMatch(/package = "com.bacon.foobar"/);
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
    expect(results['/android/app/src/main/java/com/bacon/foobar/MainActivity.kt']).toMatch(
      /package com.bacon.foobar/
    );
  });
  it('does not modify imports overlapping with package name', async () => {
    const projectRoot = '/';
    vol.fromJSON(rnFixture, projectRoot);

    // Execute the initial rename from cloning the template.
    // This step is executed when extracting the template tarball, through a stream transform.
    // It's necessary to generate the proper project when creating a bare project (without prebuild).
    await renamePackageOnDiskForType({
      projectRoot,
      type: 'main',
      packageName: 'com.f',
    });
    const initial = vol.toJSON();
    expect(initial['/android/app/src/main/java/com/f/MainActivity.kt']).toMatch(/package com.f/);
    expect(initial['/android/app/src/main/java/com/f/MainActivity.kt']).toMatch(
      /import com.facebook.react.ReactActivity/
    );

    // Execute it again, changing it to the desired package name
    await renamePackageOnDiskForType({
      projectRoot,
      type: 'main',
      packageName: 'dev.expo.test',
    });
    const results = vol.toJSON();
    expect(results['/android/app/src/main/java/dev/expo/test/MainActivity.kt']).toMatch(
      /package dev.expo.test/
    );
    expect(results['/android/app/src/main/java/dev/expo/test/MainActivity.kt']).toMatch(
      /import com.facebook.react.ReactActivity/
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

describe(kotlinSanitized, () => {
  it(`sanitizes kotlin package names`, () => {
    expect(kotlinSanitized('com.example.xyz')).toBe('com.example.xyz');
    expect(kotlinSanitized('is.pvin.appname')).toBe('`is`.pvin.appname');
    expect(kotlinSanitized('com.fun.wow')).toBe('com.`fun`.wow');
  });
});
