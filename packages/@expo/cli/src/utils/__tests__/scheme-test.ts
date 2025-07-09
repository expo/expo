import { AndroidConfig, IOSConfig } from '@expo/config-plugins';
import { getInfoPlistPathFromPbxproj } from '@expo/config-plugins/build/ios/utils/getInfoPlistPath';
import { vol } from 'memfs';
import path from 'path';

import { getSchemesForAndroidAsync, getSchemesForIosAsync } from '../scheme';

jest.mock('fs');
jest.mock('@expo/config-plugins');
jest.mock('@expo/config-plugins/build/ios/utils/getInfoPlistPath');

// TODO: replace with `jest.mocked`, when updating Jest

describe(getSchemesForAndroidAsync, () => {
  it('resolves longest scheme without known expo schemes', async () => {
    jest
      .mocked(AndroidConfig.Scheme.getSchemesFromManifest)
      .mockResolvedValue(['com.expo.test', 'com.expo.longertest', 'com.expo.longesttest']);

    await expect(getSchemesForAndroidAsync('/fake-project')).resolves.toEqual([
      'com.expo.longesttest',
      'com.expo.longertest',
      'com.expo.test',
    ]);
  });

  it('resolves known expo schemes before longest schemes', async () => {
    jest
      .mocked(AndroidConfig.Scheme.getSchemesFromManifest)
      .mockResolvedValue(['com.expo.longesttest', 'exp+com.expo.test']);

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
    jest.mocked(getInfoPlistPathFromPbxproj).mockReturnValue('fake-pbxproject');
    jest
      .mocked(IOSConfig.Scheme.getSchemesFromPlist)
      .mockReturnValue(['com.expo.test', 'com.expo.longertest', 'com.expo.longesttest']);

    await expect(getSchemesForIosAsync('fake-project')).resolves.toEqual([
      'com.expo.longesttest',
      'com.expo.longertest',
      'com.expo.test',
    ]);
  });

  it('resolves known expo schemes before longest schemes', async () => {
    jest.mocked(getInfoPlistPathFromPbxproj).mockReturnValue('fake-pbxproject');
    jest
      .mocked(IOSConfig.Scheme.getSchemesFromPlist)
      .mockReturnValue(['com.expo.longesttest', 'exp+com.expo.test']);

    await expect(getSchemesForIosAsync('fake-project')).resolves.toEqual(['exp+com.expo.test']);
  });
});
