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

  it(`resolves launch properties with fully custom app id and custom main activity`, async () => {
    const customAndroidManifest = {
      'android/app/src/main/AndroidManifest.xml': `<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.reactnativeproject">
        <uses-permission android:name="android.permission.INTERNET" />
      
        <queries>
          <!-- Support checking for http(s) links via the Linking API -->
          <intent>
            <action android:name="android.intent.action.VIEW" />
            <category android:name="android.intent.category.BROWSABLE" />
            <data android:scheme="https" />
          </intent>
        </queries>
        
        <application
          android:name=".MainApplication"
          android:label="@string/app_name"
          android:allowBackup="false"
          android:theme="@style/AppTheme">
          <activity
            android:name="com.reactnativeproject.MainActivity"
            android:label="@string/app_name"
            android:configChanges="keyboard|keyboardHidden|orientation|screenSize|uiMode"
            android:launchMode="singleTask"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
          </activity>
          <activity android:name="com.facebook.react.devsupport.DevSettingsActivity" />
        </application>
      
      </manifest>
      `,
    };
    vol.fromJSON({ ...rnFixture, ...customAndroidManifest }, '/');
    expect(await resolveLaunchPropsAsync('/', { appId: 'dev.expo.test' })).toEqual({
      launchActivity: 'dev.expo.test/com.reactnativeproject.MainActivity',
      mainActivity: 'com.reactnativeproject.MainActivity',
      packageName: 'com.bacon.mydevicefamilyproject',
      customAppId: 'dev.expo.test',
    });
  });
});
