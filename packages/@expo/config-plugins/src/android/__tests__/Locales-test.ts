import { vol } from 'memfs';
import * as nodePath from 'path';

import { readAllFiles } from '../../plugins/__tests__/fixtures/react-native-project';
import * as WarningAggregator from '../../utils/warnings';
import { getLocales, setLocalesAsync } from '../Locales';
jest.mock('fs');
jest.mock('../../utils/warnings');

describe('Android Locales', () => {
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

describe('e2e: Android locales', () => {
  const projectRoot = '/app';
  beforeAll(async () => {
    vol.fromJSON(
      {
        ...readAllFiles(),
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
      },
      projectRoot
    );
    const mockXML = {
      writeXMLAsync: ({ path, xml }) => {
        vol.mkdirSync(nodePath.dirname(path), { recursive: true });
        vol.writeFileSync(path, jest.requireActual('../../utils/XML').format(xml));
      },
    };
    const mockJSONFile = {
      readAsync: (path) => JSON.parse(vol.readFileSync(path).toString()),
    };
    jest.mock('../../utils/XML', () => mockXML);
    jest.mock('@expo/json-file', () => mockJSONFile);
  });

  afterAll(() => {
    vol.reset();
  });

  it('writes all the language files expected', async () => {
    await setLocalesAsync(
      {
        locales: {
          fr: 'lang/fr.json',
          'en-US': 'lang/en-US.json',
          en: 'lang/en.json',
          // doesn't exist
          xx: 'lang/xx.json',
          // partially support inlining the JSON so our Expo Config type doesn't conflict with the resolved manifest type.
          es: { CFBundleDisplayName: 'spanish-name' },
        },
      },
      { projectRoot }
    );

    expect(vol.readFileSync('/app/android/app/src/main/res/values-b+es/strings.xml').toString())
      .toMatchInlineSnapshot(`
      "<resources>
        <string name="CFBundleDisplayName">"spanish-name"</string>
      </resources>"
    `);
    // backwards compatibility
    expect(vol.readFileSync('/app/android/app/src/main/res/values-b+en/strings.xml').toString())
      .toMatchInlineSnapshot(`
      "<resources>
        <string name="CFBundleDisplayName">"us-name"</string>
        <string name="app_name">"us-name"</string>
      </resources>"
    `);
    expect(vol.readFileSync('/app/android/app/src/main/res/values-b+en+US/strings.xml').toString())
      .toMatchInlineSnapshot(`
      "<resources>
        <string name="app_name">"us-name"</string>
      </resources>"
    `);

    expect(WarningAggregator.addWarningForPlatform).toHaveBeenCalledWith(
      'android',
      'locales.xx',
      'Failed to parse JSON of locale file for language: xx',
      'https://docs.expo.dev/guides/localization/#translating-app-metadata'
    );
  });
});
