import { vol } from 'memfs';

import configureAndroidManifestXml from '../AndroidManifest.xml';
import reactNativeProject from './fixtures/react-native-project-structure';

// in `__mocks__/fs.ts` memfs is being used as a mocking library
jest.mock('fs');

describe('AndroidManifest.xml', () => {
  describe('configureAndroidManifestXml', () => {
    beforeEach(() => {
      vol.fromJSON(reactNativeProject, '/app');
    });
    afterEach(() => {
      vol.reset();
    });

    const androidMainPath = '/app/android/app/src/main';
    const filePath = `${androidMainPath}/AndroidManifest.xml`;

    it('updates basic AndroidManifest file', async () => {
      await configureAndroidManifestXml(androidMainPath);
      const actual = vol.readFileSync(filePath, 'utf-8');
      const expected = `<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.reactnativeproject">
  <uses-permission android:name="android.permission.INTERNET"/>
  <application
    android:name=".MainApplication"
    android:label="@string/app_name"
    android:allowBackup="false"
    android:theme="@style/AppTheme"
  >
    <activity
      android:name=".MainActivity"
      android:label="@string/app_name"
      android:configChanges="keyboard|keyboardHidden|orientation|screenSize|uiMode"
      android:launchMode="singleTask"
      android:windowSoftInputMode="adjustResize"
      android:theme="@style/Theme.App.SplashScreen"
    >
      <intent-filter>
        <action android:name="android.intent.action.MAIN"/>
        <category android:name="android.intent.category.LAUNCHER"/>
      </intent-filter>
    </activity>
    <activity android:name="com.facebook.react.devsupport.DevSettingsActivity"/>
  </application>
</manifest>
`;
      expect(actual).toEqual(expected);
    });

    it('updates complex AndroidManifest file', async () => {
      vol.writeFileSync(
        filePath,
        `<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.reactnativeproject">
  <uses-permission android:name="android.permission.INTERNET"/>
  <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>
  <!-- OPTIONAL PERMISSIONS, REMOVE WHATEVER YOU DO NOT NEED -->
  <uses-permission android:name="android.permission.MANAGE_DOCUMENTS"/>
  <uses-permission android:name="android.permission.READ_INTERNAL_STORAGE"/>
  <uses-permission android:name="android.permission.READ_PHONE_STATE"/>
  <uses-permission android:name="android.permission.USE_FINGERPRINT"/>
  <uses-permission android:name="android.permission.VIBRATE"/>
  <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS"/>
  <!-- These require runtime permissions on M -->
  <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
  <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
  <uses-permission android:name="android.permission.CAMERA"/>
  <uses-permission android:name="android.permission.READ_CONTACTS"/>
  <uses-permission android:name="android.permission.READ_CALENDAR"/>
  <uses-permission android:name="android.permission.WRITE_CALENDAR"/>
  <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
  <uses-permission android:name="android.permission.RECORD_AUDIO"/>
  <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
  <uses-permission android:name="android.permission.WRITE_SETTINGS"/>
  <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
  <uses-permission android:name="android.permission.WAKE_LOCK"/>
  <uses-permission android:name="com.google.android.c2dm.permission.RECEIVE"/>
  <!-- END OF OPTIONAL DEPS -->
  <application
    android:name=".MainApplication"
    android:label="@string/app_name"
    android:icon="@mipmap/ic_launcher"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:allowBackup="false"
    android:theme="@style/AppTheme"
  >
    <meta-data android:name="expo.modules.updates.EXPO_UPDATE_URL" android:value="YOUR-APP-URL-HERE"/>
    <meta-data android:name="expo.modules.updates.EXPO_SDK_VERSION" android:value="YOUR-APP-SDK-VERSION-HERE"/>
    <!-- [Custom] Expo Facebook -->
    <meta-data
        android:name="com.facebook.sdk.ApplicationId"
        android:value="@string/facebook_app_id" />
    <!-- [Custom] End Expo Facebook -->
    <activity
      android:name=".MainActivity"
      android:label="@string/app_name"
      android:configChanges="keyboard|keyboardHidden|orientation|screenSize"
      android:windowSoftInputMode="adjustResize"
      android:screenOrientation="portrait"
      android:theme="@style/AppTheme"
    >
      <intent-filter>
        <action android:name="android.intent.action.MAIN"/>
        <category android:name="android.intent.category.LAUNCHER"/>
      </intent-filter>

      <!-- [Custom] Deep linking -->
      <intent-filter>
        <action android:name="android.intent.action.VIEW"/>
        <category android:name="android.intent.category.DEFAULT"/>
        <category android:name="android.intent.category.BROWSABLE"/>
        <data android:scheme="myapp"/>
      </intent-filter>
    </activity>
    <activity android:name="com.facebook.react.devsupport.DevSettingsActivity"/>
  </application>
</manifest>
`
      );

      await configureAndroidManifestXml(androidMainPath);
      const actual = vol.readFileSync(filePath, 'utf-8');
      const expected = `<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.reactnativeproject">
  <uses-permission android:name="android.permission.INTERNET"/>
  <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>
  <!-- OPTIONAL PERMISSIONS, REMOVE WHATEVER YOU DO NOT NEED -->
  <uses-permission android:name="android.permission.MANAGE_DOCUMENTS"/>
  <uses-permission android:name="android.permission.READ_INTERNAL_STORAGE"/>
  <uses-permission android:name="android.permission.READ_PHONE_STATE"/>
  <uses-permission android:name="android.permission.USE_FINGERPRINT"/>
  <uses-permission android:name="android.permission.VIBRATE"/>
  <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS"/>
  <!-- These require runtime permissions on M -->
  <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
  <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
  <uses-permission android:name="android.permission.CAMERA"/>
  <uses-permission android:name="android.permission.READ_CONTACTS"/>
  <uses-permission android:name="android.permission.READ_CALENDAR"/>
  <uses-permission android:name="android.permission.WRITE_CALENDAR"/>
  <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
  <uses-permission android:name="android.permission.RECORD_AUDIO"/>
  <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
  <uses-permission android:name="android.permission.WRITE_SETTINGS"/>
  <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
  <uses-permission android:name="android.permission.WAKE_LOCK"/>
  <uses-permission android:name="com.google.android.c2dm.permission.RECEIVE"/>
  <!-- END OF OPTIONAL DEPS -->
  <application
    android:name=".MainApplication"
    android:label="@string/app_name"
    android:icon="@mipmap/ic_launcher"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:allowBackup="false"
    android:theme="@style/AppTheme"
  >
    <meta-data android:name="expo.modules.updates.EXPO_UPDATE_URL" android:value="YOUR-APP-URL-HERE"/>
    <meta-data android:name="expo.modules.updates.EXPO_SDK_VERSION" android:value="YOUR-APP-SDK-VERSION-HERE"/>
    <!-- [Custom] Expo Facebook -->
    <meta-data android:name="com.facebook.sdk.ApplicationId" android:value="@string/facebook_app_id"/>
    <!-- [Custom] End Expo Facebook -->
    <activity
      android:name=".MainActivity"
      android:label="@string/app_name"
      android:configChanges="keyboard|keyboardHidden|orientation|screenSize"
      android:windowSoftInputMode="adjustResize"
      android:screenOrientation="portrait"
      android:theme="@style/Theme.App.SplashScreen"
    >
      <intent-filter>
        <action android:name="android.intent.action.MAIN"/>
        <category android:name="android.intent.category.LAUNCHER"/>
      </intent-filter>
      <!-- [Custom] Deep linking -->
      <intent-filter>
        <action android:name="android.intent.action.VIEW"/>
        <category android:name="android.intent.category.DEFAULT"/>
        <category android:name="android.intent.category.BROWSABLE"/>
        <data android:scheme="myapp"/>
      </intent-filter>
    </activity>
    <activity android:name="com.facebook.react.devsupport.DevSettingsActivity"/>
  </application>
</manifest>
`;
      expect(actual).toEqual(expected);
    });
  });
});
