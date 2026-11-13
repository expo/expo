import plist from '@expo/plist';
import { vol } from 'memfs';

import {
  hasRequiredAndroidFilesAsync,
  hasRequiredIOSFilesAsync,
} from '../../prebuild/clearNativeFolder';
import { getOptionalDevClientSchemeAsync } from '../scheme';

jest.mock('../../prebuild/clearNativeFolder', () => ({
  hasRequiredAndroidFilesAsync: jest.fn(),
  hasRequiredIOSFilesAsync: jest.fn(),
}));
jest.mock('@expo/config-plugins/build/ios/utils/getInfoPlistPath', () => ({
  getInfoPlistPathFromPbxproj: () => 'Info.plist',
}));

describe(getOptionalDevClientSchemeAsync, () => {
  beforeEach(() => {
    vol.fromJSON({
      '/project/package.json': JSON.stringify({ name: 'test', version: '1.0.0' }),
      '/project/app.json': JSON.stringify({
        expo: {
          name: 'Test',
          slug: 'test',
          sdkVersion: '58.0.0',
          scheme: 'test-preview',
        },
      }),
      '/project/ios/Info.plist': plist.build({
        CFBundleURLTypes: [
          { CFBundleURLSchemes: ['$(APP_URL_SCHEME)', '$(PRODUCT_BUNDLE_IDENTIFIER)'] },
        ],
      }),
      '/project/android/app/src/main/AndroidManifest.xml': `
        <manifest xmlns:android="http://schemas.android.com/apk/res/android">
          <application>
            <activity android:name=".MainActivity" android:launchMode="singleTask">
              <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="\${appScheme}" />
                <data android:scheme="\${applicationId}" />
              </intent-filter>
            </activity>
          </application>
        </manifest>
      `,
    });
  });

  afterEach(() => {
    vol.reset();
  });

  it.each([
    { platform: 'iOS and Android', ios: true, android: true },
    { platform: 'iOS', ios: true, android: false },
    { platform: 'Android', ios: false, android: true },
  ])(
    'uses the resolved app config when $platform schemes contain build variables',
    async (native) => {
      jest.mocked(hasRequiredIOSFilesAsync).mockResolvedValue(native.ios);
      jest.mocked(hasRequiredAndroidFilesAsync).mockResolvedValue(native.android);

      await expect(getOptionalDevClientSchemeAsync('/project')).resolves.toEqual({
        scheme: 'test-preview',
        resolution: 'config',
      });
    }
  );

  it('only uses the config scheme when every native project can support it', async () => {
    jest.mocked(hasRequiredIOSFilesAsync).mockResolvedValue(true);
    jest.mocked(hasRequiredAndroidFilesAsync).mockResolvedValue(true);
    vol.writeFileSync(
      '/project/ios/Info.plist',
      plist.build({ CFBundleURLTypes: [{ CFBundleURLSchemes: ['test-preview'] }] })
    );

    await expect(getOptionalDevClientSchemeAsync('/project')).resolves.toEqual({
      scheme: 'test-preview',
      resolution: 'config',
    });

    vol.writeFileSync(
      '/project/ios/Info.plist',
      plist.build({ CFBundleURLTypes: [{ CFBundleURLSchemes: ['other-app'] }] })
    );

    await expect(getOptionalDevClientSchemeAsync('/project')).resolves.toEqual({
      scheme: null,
      resolution: 'shared',
    });
  });

  it('uses the first valid configured scheme', async () => {
    jest.mocked(hasRequiredIOSFilesAsync).mockResolvedValue(true);
    jest.mocked(hasRequiredAndroidFilesAsync).mockResolvedValue(true);
    vol.writeFileSync(
      '/project/app.json',
      JSON.stringify({
        expo: {
          name: 'Test',
          slug: 'test',
          sdkVersion: '58.0.0',
          scheme: ['$(APP_URL_SCHEME)', 'invalid scheme', 'test-preview', 'test-development'],
        },
      })
    );

    await expect(getOptionalDevClientSchemeAsync('/project')).resolves.toEqual({
      scheme: 'test-preview',
      resolution: 'config',
    });
  });

  it('does not return a shared build variable when no config scheme is available', async () => {
    jest.mocked(hasRequiredIOSFilesAsync).mockResolvedValue(true);
    jest.mocked(hasRequiredAndroidFilesAsync).mockResolvedValue(true);
    vol.writeFileSync(
      '/project/ios/Info.plist',
      plist.build({ CFBundleURLTypes: [{ CFBundleURLSchemes: ['${appScheme}'] }] })
    );
    vol.writeFileSync(
      '/project/app.json',
      JSON.stringify({ expo: { name: 'Test', slug: 'test', sdkVersion: '58.0.0' } })
    );

    await expect(getOptionalDevClientSchemeAsync('/project')).resolves.toEqual({
      scheme: null,
      resolution: 'shared',
    });
  });
});
