import { AndroidConfig } from '@expo/config-plugins';
import { resolve } from 'path';
import { Parser } from 'xml2js';

import {
  getFacebookAdvertiserIDCollection,
  getFacebookAppId,
  getFacebookAutoInitEnabled,
  getFacebookAutoLogAppEvents,
  getFacebookDisplayName,
  getFacebookScheme,
  setFacebookConfig,
} from '../withFacebookAndroid';

const { getMainApplication, readAndroidManifestAsync } = AndroidConfig.Manifest;

const fixturesPath = resolve(__dirname, 'fixtures');
const sampleManifestPath = resolve(fixturesPath, 'react-native-AndroidManifest.xml');

const filledManifest = `<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.expo.mycoolapp">

    <uses-permission android:name="android.permission.INTERNET" />

    <application
      android:name=".MainApplication"
      android:label="@string/app_name"
      android:icon="@mipmap/ic_launcher"
      android:roundIcon="@mipmap/ic_launcher_round"
      android:allowBackup="true"
      android:theme="@style/AppTheme">

      <meta-data android:name="com.facebook.sdk.ApplicationId" android:value="@string/facebook_app_id"/>
      <meta-data android:name="com.facebook.sdk.ApplicationName" android:value="my-display-name"/>
      <meta-data android:name="com.facebook.sdk.AutoInitEnabled" android:value="true"/>
      <meta-data android:name="com.facebook.sdk.AutoLogAppEventsEnabled" android:value="false"/>
      <meta-data android:name="com.facebook.sdk.AdvertiserIDCollectionEnabled" android:value="false"/>

      <activity
        android:name=".MainActivity"
        android:launchMode="singleTask"
        android:label="@string/app_name"
        android:configChanges="keyboard|keyboardHidden|orientation|screenSize"
        android:windowSoftInputMode="adjustResize">
        <intent-filter>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LAUNCHER" />
        </intent-filter>
      </activity>
      <activity android:name="com.facebook.react.devsupport.DevSettingsActivity" />

      <activity android:name="com.facebook.CustomTabActivity" android:exported="true">
        <intent-filter>
          <action android:name="android.intent.action.VIEW"/>
          <category android:name="android.intent.category.DEFAULT"/>
          <category android:name="android.intent.category.BROWSABLE"/>
          <data android:scheme="myscheme"/>
        </intent-filter>
      </activity>
    </application>

</manifest>
`;

describe('Android facebook config', () => {
  it(`returns null from all getters if no value provided`, () => {
    expect(getFacebookScheme({})).toBe(null);
    expect(getFacebookAppId({})).toBe(null);
    expect(getFacebookDisplayName({})).toBe(null);
    expect(getFacebookAutoLogAppEvents({})).toBe(null);
    expect(getFacebookAutoInitEnabled({})).toBe(null);
    expect(getFacebookAdvertiserIDCollection({})).toBe(null);
  });

  it(`returns correct value from all getters if value provided`, () => {
    expect(getFacebookScheme({ facebookScheme: 'myscheme' })).toMatch('myscheme');
    expect(getFacebookAppId({ facebookAppId: 'my-app-id' })).toMatch('my-app-id');
    expect(getFacebookDisplayName({ facebookDisplayName: 'my-display-name' })).toMatch(
      'my-display-name'
    );
    expect(getFacebookAutoLogAppEvents({ facebookAutoLogAppEventsEnabled: false })).toBe(false);
    expect(getFacebookAutoInitEnabled({ facebookAutoInitEnabled: true })).toBe(true);
    expect(
      getFacebookAdvertiserIDCollection({ facebookAdvertiserIDCollectionEnabled: false })
    ).toBe(false);
  });

  it('adds scheme, appid, display name, autolog events, auto init, advertiser id collection to androidmanifest.xml', async () => {
    let androidManifestJson = await readAndroidManifestAsync(sampleManifestPath);
    const facebookConfig = {
      facebookScheme: 'myscheme',
      facebookAppId: 'my-app-id',
      facebookDisplayName: 'my-display-name',
      facebookAutoLogAppEventsEnabled: false,
      facebookAutoInitEnabled: true,
      facebookAdvertiserIDCollectionEnabled: false,
    };
    androidManifestJson = setFacebookConfig(facebookConfig, androidManifestJson);
    // Run this twice to ensure copies don't get added.
    androidManifestJson = setFacebookConfig(facebookConfig, androidManifestJson);

    const mainApplication = getMainApplication(androidManifestJson);

    const facebookActivity = mainApplication['activity'].filter(
      (e) => e.$['android:name'] === 'com.facebook.CustomTabActivity'
    );
    expect(facebookActivity).toHaveLength(1);

    const applicationId = mainApplication['meta-data'].filter(
      (e) => e.$['android:name'] === 'com.facebook.sdk.ApplicationId'
    );
    expect(applicationId).toHaveLength(1);
    expect(applicationId[0].$['android:value']).toMatch('@string/facebook_app_id');

    const displayName = mainApplication['meta-data'].filter(
      (e) => e.$['android:name'] === 'com.facebook.sdk.ApplicationName'
    );
    expect(displayName).toHaveLength(1);
    expect(displayName[0].$['android:value']).toMatch(facebookConfig.facebookDisplayName);

    const autoLogAppEventsEnabled = mainApplication['meta-data'].filter(
      (e) => e.$['android:name'] === 'com.facebook.sdk.AutoLogAppEventsEnabled'
    );
    expect(autoLogAppEventsEnabled).toHaveLength(1);
    expect(autoLogAppEventsEnabled[0].$['android:value']).toMatch(
      facebookConfig.facebookAutoLogAppEventsEnabled.toString()
    );

    const advertiserIDCollectionEnabled = mainApplication['meta-data'].filter(
      (e) => e.$['android:name'] === 'com.facebook.sdk.AdvertiserIDCollectionEnabled'
    );
    expect(advertiserIDCollectionEnabled).toHaveLength(1);
    expect(advertiserIDCollectionEnabled[0].$['android:value']).toMatch(
      facebookConfig.facebookAdvertiserIDCollectionEnabled.toString()
    );

    const autoInitEnabled = mainApplication['meta-data'].filter(
      (e) => e.$['android:name'] === 'com.facebook.sdk.AutoInitEnabled'
    );
    expect(autoInitEnabled).toHaveLength(1);
    expect(autoInitEnabled[0].$['android:value']).toMatch(
      facebookConfig.facebookAutoInitEnabled.toString()
    );
  });

  it('removes scheme, appid, display name, autolog events, auto init, advertiser id collection to androidmanifest.xml', async () => {
    const parser = new Parser();
    let androidManifestJson = await parser.parseStringPromise(filledManifest);

    const facebookConfig = {};
    androidManifestJson = setFacebookConfig(facebookConfig, androidManifestJson);

    const mainApplication = getMainApplication(androidManifestJson);

    const facebookActivity = mainApplication.activity.filter(
      (e) => e.$['android:name'] === 'com.facebook.CustomTabActivity'
    );
    expect(facebookActivity).toHaveLength(0);
    const applicationId = mainApplication['meta-data'].filter(
      (e) => e.$['android:name'] === 'com.facebook.sdk.ApplicationId'
    );
    expect(applicationId).toHaveLength(0);

    const displayName = mainApplication['meta-data'].filter(
      (e) => e.$['android:name'] === 'com.facebook.sdk.ApplicationName'
    );
    expect(displayName).toHaveLength(0);

    const autoLogAppEventsEnabled = mainApplication['meta-data'].filter(
      (e) => e.$['android:name'] === 'com.facebook.sdk.AutoLogAppEventsEnabled'
    );
    expect(autoLogAppEventsEnabled).toHaveLength(0);

    const advertiserIDCollectionEnabled = mainApplication['meta-data'].filter(
      (e) => e.$['android:name'] === 'com.facebook.sdk.AdvertiserIDCollectionEnabled'
    );
    expect(advertiserIDCollectionEnabled).toHaveLength(0);

    const autoInitEnabled = mainApplication['meta-data'].filter(
      (e) => e.$['android:name'] === 'com.facebook.sdk.AutoInitEnabled'
    );
    expect(autoInitEnabled).toHaveLength(0);
  });
});
