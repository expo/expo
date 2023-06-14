import { getConfig } from '@expo/config';
import { AndroidConfig, IOSConfig } from '@expo/config-plugins';
import { getInfoPlistPathFromPbxproj } from '@expo/config-plugins/build/ios/utils/getInfoPlistPath';
import { vol } from 'memfs';
import path from 'path';

import { getSchemeAsync, getSchemesForAndroidAsync, getSchemesForIosAsync } from '../scheme';

jest.mock('fs');
jest.mock('@expo/config');
jest.mock('@expo/config-plugins');
jest.mock('@expo/config-plugins/build/ios/utils/getInfoPlistPath');

// TODO: replace with `jest.mocked`, when updating Jest
const asMock = (fn: any): jest.Mock => fn;

describe(getSchemesForAndroidAsync, () => {
  it('resolves longest scheme without known expo schemes', async () => {
    asMock(AndroidConfig.Scheme.getSchemesFromManifest).mockResolvedValueOnce([
      'com.expo.test',
      'com.expo.longertest',
      'com.expo.longesttest',
    ]);

    await expect(getSchemesForAndroidAsync('/fake-project')).resolves.toEqual([
      'com.expo.longesttest',
      'com.expo.longertest',
      'com.expo.test',
    ]);
  });

  it('resolves known expo schemes before longest schemes', async () => {
    asMock(AndroidConfig.Scheme.getSchemesFromManifest).mockResolvedValueOnce([
      'com.expo.longesttest',
      'exp+com.expo.test',
    ]);

    await expect(getSchemesForAndroidAsync('/fake-project')).resolves.toEqual([
      'exp+com.expo.test',
    ]);
  });
});

describe(getSchemesForIosAsync, () => {
  beforeAll(() => {
    const fakePlist = `
      <?xml version="1.0" encoding="UTF-8"?>
      <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
      <plist version="1.0">
        <dict>
          <key>fake</key>
          <string>plist</string>
        </dic>
      </plist>
    `;

    vol.fromJSON({
      [path.join('fake-project', 'ios', 'fake-pbxproject')]: fakePlist,
    });
  });

  afterAll(() => {
    vol.reset();
  });

  it('resolves longest scheme without known expo schemes', async () => {
    asMock(getInfoPlistPathFromPbxproj).mockReturnValueOnce('fake-pbxproject');
    asMock(IOSConfig.Scheme.getSchemesFromPlist).mockReturnValueOnce([
      'com.expo.test',
      'com.expo.longertest',
      'com.expo.longesttest',
    ]);

    await expect(getSchemesForIosAsync('fake-project')).resolves.toEqual([
      'com.expo.longesttest',
      'com.expo.longertest',
      'com.expo.test',
    ]);
  });

  it('resolves known expo schemes before longest schemes', async () => {
    asMock(getInfoPlistPathFromPbxproj).mockReturnValueOnce('fake-pbxproject');
    asMock(IOSConfig.Scheme.getSchemesFromPlist).mockReturnValueOnce([
      'com.expo.longesttest',
      'exp+com.expo.test',
    ]);

    await expect(getSchemesForIosAsync('fake-project')).resolves.toEqual(['exp+com.expo.test']);
  });
});

describe(getSchemeAsync, () => {
  it('should resolve to expo config scheme in a managed project', async () => {
    asMock(getConfig).mockReturnValueOnce({
      exp: {
        scheme: 'myapp',
      },
    });

    await expect(
      getSchemeAsync('fake-project', {
        customized: false,
        expoGoCompatible: false,
        devClientInstalled: false,
      })
    ).resolves.toEqual('myapp');
  });

  it('should resolve to scheme which is intersecting with expo config and native files', async () => {
    asMock(getConfig).mockReturnValueOnce({
      exp: {
        scheme: ['myapp', 'myapp2'],
      },
    });

    const fakePlist = `
      <?xml version="1.0" encoding="UTF-8"?>
      <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
      <plist version="1.0">
        <dict>
          <key>fake</key>
          <string>plist</string>
        </dic>
      </plist>
    `;

    vol.fromJSON({
      [path.join('fake-project', 'ios', 'fake-pbxproject')]: fakePlist,
    });

    asMock(getInfoPlistPathFromPbxproj).mockReturnValueOnce('fake-pbxproject');
    asMock(IOSConfig.Scheme.getSchemesFromPlist).mockReturnValueOnce([
      'com.expo.test',
      'myapp',
      'myapp2',
    ]);

    await expect(
      getSchemeAsync('fake-project', {
        customized: true,
        expoGoCompatible: false,
        devClientInstalled: false,
      })
    ).resolves.toEqual('myapp');

    vol.reset();
  });

  it('should resolve to default native scheme when no scheme specified in expo config', async () => {
    asMock(getConfig).mockReturnValueOnce({
      exp: {},
    });

    const fakePlist = `
      <?xml version="1.0" encoding="UTF-8"?>
      <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
      <plist version="1.0">
        <dict>
          <key>fake</key>
          <string>plist</string>
        </dic>
      </plist>
    `;

    vol.fromJSON({
      [path.join('fake-project', 'ios', 'fake-pbxproject')]: fakePlist,
    });

    asMock(getInfoPlistPathFromPbxproj).mockReturnValueOnce('fake-pbxproject');
    asMock(IOSConfig.Scheme.getSchemesFromPlist).mockReturnValueOnce(['com.expo.test']);

    await expect(
      getSchemeAsync('fake-project', {
        customized: true,
        expoGoCompatible: false,
        devClientInstalled: false,
      })
    ).resolves.toEqual('com.expo.test');

    vol.reset();
  });
});
