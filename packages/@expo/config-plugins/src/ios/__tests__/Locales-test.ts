import * as fs from 'fs';
import { vol } from 'memfs';

import { getDirFromFS } from './utils/getDirFromFS';
import rnFixture from '../../plugins/__tests__/fixtures/react-native-project';
import * as WarningAggregator from '../../utils/warnings';
import { getLocales, setLocalesAsync } from '../Locales';
import { getPbxproj } from '../utils/Xcodeproj';

jest.mock('fs');
jest.mock('../../utils/warnings');

describe('iOS Locales', () => {
  it(`returns null if no values are provided`, () => {
    expect(getLocales({})).toBeNull();
  });

  it(`returns the locales object`, () => {
    expect(
      getLocales({
        locales: {},
      })
    ).toStrictEqual({});
  });
});

describe('e2e: iOS locales', () => {
  const projectRoot = '/app';
  beforeAll(async () => {
    vol.fromJSON(
      {
        'ios/testproject.xcodeproj/project.pbxproj':
          rnFixture['ios/HelloWorld.xcodeproj/project.pbxproj'],
        'ios/testproject/AppDelegate.m': '',
        'lang/fr.json': JSON.stringify({
          ios: {
            CFBundleDisplayName: 'french-name',
          },
          android: {
            app_name: 'french-name',
          },
        }),
        'lang/en-US.json': JSON.stringify({
          ios: {
            CFBundleDisplayName: 'us-name',
          },
          android: {
            app_name: 'us-name',
          },
        }),
        // backwards compatiblity test
        'lang/en.json': JSON.stringify({
          CFBundleDisplayName: 'us-name',
          app_name: 'us-name',
        }),
        // with localizableStrings test
        'lang/ar.json': JSON.stringify({
          ios: {
            CFBundleDisplayName: 'ar-name',
            localizableStrings: {
              NOTIF_KEY: 'ar-notification',
            },
          },
          android: {
            app_name: 'ar-name',
          },
        }),
        // localizableStrings only test
        'lang/de.json': JSON.stringify({
          ios: {
            localizableStrings: {
              NOTIF_KEY: 'de-notification',
            },
          },
          android: {
            app_name: 'de-name',
          },
        }),
      },
      projectRoot
    );
  });

  afterAll(() => {
    vol.reset();
  });

  it('writes all the image files expected', async () => {
    let project = getPbxproj(projectRoot);

    project = await setLocalesAsync(
      {
        locales: {
          fr: 'lang/fr.json',
          // doesn't exist
          xx: 'lang/xx.json',

          // partially support inlining the JSON so our Expo Config type doesn't conflict with the resolved manifest type.
          es: { CFBundleDisplayName: 'spanish-name' },
          'en-US': 'lang/en-US.json',
          // support backwards compatibility for `locales` structure without platform keys.
          en: 'lang/en.json',
          ar: 'lang/ar.json',
          // shouldn't have an infoPlist
          de: 'lang/de.json',
        },
      },
      { project, projectRoot }
    );
    // Sync the Xcode project with the changes.
    fs.writeFileSync(project.filepath, project.writeSync());

    const after = getDirFromFS(vol.toJSON(), projectRoot);
    const infoPlists = Object.keys(after).filter((value) => value.endsWith('InfoPlist.strings'));
    const localizableStrings = Object.keys(after).filter((value) =>
      value.endsWith('Localizable.strings')
    );
    expect(infoPlists.length).toBe(5);
    expect(after[infoPlists[0]]).toMatchSnapshot();
    // Test that the inlined locale is resolved.
    expect(after[infoPlists[1]]).toMatch(/spanish-name/);
    expect(after[infoPlists[2]]).toMatchInlineSnapshot(`"CFBundleDisplayName = "us-name";"`);
    expect(after[infoPlists[3]]).toMatchInlineSnapshot(`
      "CFBundleDisplayName = "us-name";
      app_name = "us-name";"
    `);
    expect(after[infoPlists[4]]).toMatchInlineSnapshot(`"CFBundleDisplayName = "ar-name";"`);
    expect(localizableStrings.length).toBe(2);
    expect(after[localizableStrings[0]]).toMatchInlineSnapshot(`"NOTIF_KEY = "ar-notification";"`);
    expect(after[localizableStrings[1]]).toMatchInlineSnapshot(`"NOTIF_KEY = "de-notification";"`);

    // Test a warning is thrown for an invalid locale JSON file.
    expect(WarningAggregator.addWarningForPlatform).toHaveBeenCalledWith(
      'ios',
      'locales.xx',
      'Failed to parse JSON of locale file for language: xx',
      'https://docs.expo.dev/guides/localization/#translating-app-metadata'
    );
  });
});
