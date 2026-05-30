import { vol } from 'memfs';

import rnFixture from '../../../prebuild/__tests__/fixtures/react-native-project';
import { resolveLaunchPropsAsync } from '../resolveLaunchProps';

describe(resolveLaunchPropsAsync, () => {
  afterEach(() => vol.reset());

  it(`throws when /android folder is missing`, async () => {
    vol.fromJSON({}, '/');
    await expect(resolveLaunchPropsAsync('/', {})).rejects.toThrow(
      /Android project folder is missing in project/
    );
  });

  it(`resolves standard launch properties`, async () => {
    vol.fromJSON(rnFixture, '/');
    expect(await resolveLaunchPropsAsync('/', {})).toEqual({
      launchActivity: 'com.bacon.mydevicefamilyproject/.MainActivity',
      mainActivity: '.MainActivity',
      packageName: 'com.bacon.mydevicefamilyproject',
      customAppId: undefined,
    });
  });

  it(`resolves standard launch properties manual but identical app id`, async () => {
    vol.fromJSON(rnFixture, '/');
    expect(
      await resolveLaunchPropsAsync('/', { appId: 'com.bacon.mydevicefamilyproject' })
    ).toEqual({
      launchActivity: 'com.bacon.mydevicefamilyproject/.MainActivity',
      mainActivity: '.MainActivity',
      packageName: 'com.bacon.mydevicefamilyproject',
      customAppId: 'com.bacon.mydevicefamilyproject',
    });
  });

  // See: https://developer.android.com/build/build-variants#change-app-id
  it(`resolves launch properties with custom suffixed app id`, async () => {
    vol.fromJSON(rnFixture, '/');
    expect(
      await resolveLaunchPropsAsync('/', { appId: 'com.bacon.mydevicefamilyproject.free' })
    ).toEqual({
      launchActivity:
        'com.bacon.mydevicefamilyproject.free/com.bacon.mydevicefamilyproject.MainActivity',
      mainActivity: '.MainActivity',
      packageName: 'com.bacon.mydevicefamilyproject',
      customAppId: 'com.bacon.mydevicefamilyproject.free',
    });
  });

  it(`resolves launch properties with fully custom app id`, async () => {
    vol.fromJSON(rnFixture, '/');
    expect(await resolveLaunchPropsAsync('/', { appId: 'dev.expo.test' })).toEqual({
      launchActivity: 'dev.expo.test/com.bacon.mydevicefamilyproject.MainActivity',
      mainActivity: '.MainActivity',
      packageName: 'com.bacon.mydevicefamilyproject',
      customAppId: 'dev.expo.test',
    });
  });

  it(`resolves launch properties with fully qualified main activity`, async () => {
    vol.fromJSON(
      {
        ...rnFixture,
        'android/app/src/main/AndroidManifest.xml': rnFixture[
          'android/app/src/main/AndroidManifest.xml'
        ].replace(
          'android:name=".MainActivity"',
          'android:name="com.reactnativeproject.MainActivity"'
        ),
      },
      '/'
    );

    expect(await resolveLaunchPropsAsync('/', { appId: 'dev.expo.test' })).toEqual({
      launchActivity: 'dev.expo.test/com.reactnativeproject.MainActivity',
      mainActivity: 'com.reactnativeproject.MainActivity',
      packageName: 'com.bacon.mydevicefamilyproject',
      customAppId: 'dev.expo.test',
    });
  });

  // AGP 7.3+ projects can declare a `namespace` that differs from the
  // `applicationId` (e.g. when the install identifier is set per build flavor
  // but the Kotlin/Java code lives under a single namespace). The launcher
  // activity must be expanded against the namespace so `am start` resolves to
  // a class that actually exists.
  it(`expands dot-shorthand activity against build.gradle namespace`, async () => {
    vol.fromJSON(
      {
        ...rnFixture,
        'android/app/build.gradle': rnFixture['android/app/build.gradle'].replace(
          'android {',
          "android {\n          namespace 'com.reactnativeproject'"
        ),
      },
      '/'
    );

    expect(await resolveLaunchPropsAsync('/', {})).toEqual({
      launchActivity: 'com.bacon.mydevicefamilyproject/com.reactnativeproject.MainActivity',
      mainActivity: '.MainActivity',
      packageName: 'com.bacon.mydevicefamilyproject',
      customAppId: undefined,
    });
  });

  it(`expands dot-shorthand activity against namespace with custom app id`, async () => {
    vol.fromJSON(
      {
        ...rnFixture,
        'android/app/build.gradle': rnFixture['android/app/build.gradle'].replace(
          'android {',
          "android {\n          namespace 'com.reactnativeproject'"
        ),
      },
      '/'
    );

    expect(await resolveLaunchPropsAsync('/', { appId: 'dev.expo.test' })).toEqual({
      launchActivity: 'dev.expo.test/com.reactnativeproject.MainActivity',
      mainActivity: '.MainActivity',
      packageName: 'com.bacon.mydevicefamilyproject',
      customAppId: 'dev.expo.test',
    });
  });
});
