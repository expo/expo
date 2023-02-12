import { AndroidConfig, XML } from '@expo/config-plugins';
import { vol } from 'memfs';

import {
  removeOldSplashStyleGroup,
  setSplashColorsForTheme,
  setSplashStylesForTheme,
} from '../withAndroidSplashStyles';

jest.mock('fs');

export const sampleStylesXML = `
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
        <item name="android:windowBackground">#222222</item>
    </style>
</resources>`;

beforeEach(async () => {
  vol.fromJSON(
    {
      './android/app/src/main/res/values/styles.xml': sampleStylesXML,
    },
    '/app'
  );
});

afterEach(async () => {
  vol.reset();
});

describe(removeOldSplashStyleGroup, () => {
  it(`removes old splash screen style`, async () => {
    const xml = await XML.parseXMLAsync(`<resources>
    <style name="Theme.App.SplashScreen" parent="Theme.AppCompat.Light.NoActionBar">
        <item name="android:windowBackground">#222222</item>
    </style>
</resources>`);
    expect(removeOldSplashStyleGroup(xml as any)).toStrictEqual({
      resources: {
        style: [],
      },
    });
  });
});

describe(setSplashColorsForTheme, () => {
  it(`sets colors`, () => {
    const xml = AndroidConfig.Colors.getColorsAsObject(
      setSplashColorsForTheme(
        {
          resources: {
            color: [],
          },
        },
        '#fff000'
      )
    );
    expect(xml).toStrictEqual({
      splashscreen_background: '#fff000',
    });
  });
  it(`removes colors`, () => {
    const xml = AndroidConfig.Colors.getColorsAsObject(
      setSplashColorsForTheme(
        AndroidConfig.Colors.getObjectAsColorsXml({
          splashscreen_background: '#fff000',
        }),
        null
      )
    );
    expect(xml).toStrictEqual({});
  });
});

describe(setSplashStylesForTheme, () => {
  it(`sets style`, () => {
    // empty XML
    const xml = {
      resources: {},
    };

    expect(
      // Extract the style
      AndroidConfig.Styles.getStylesGroupAsObject(setSplashStylesForTheme(xml), {
        name: 'Theme.App.SplashScreen',
        parent: 'AppTheme',
      })
    ).toStrictEqual({
      'android:windowBackground': '@drawable/splashscreen',
    });
  });
});
