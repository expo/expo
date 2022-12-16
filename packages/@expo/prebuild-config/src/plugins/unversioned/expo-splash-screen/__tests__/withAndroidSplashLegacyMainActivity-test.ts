import { AndroidConfig } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
import fs from 'fs-extra';
import { vol } from 'memfs';

import fixtures from '../../../__tests__/fixtures/react-native-project';
import { setSplashScreenLegacyMainActivity } from '../withAndroidSplashLegacyMainActivity';

jest.mock('fs');

describe(setSplashScreenLegacyMainActivity, () => {
  beforeAll(async () => {
    vol.fromJSON(fixtures, '/app');
  });

  afterAll(async () => {
    vol.reset();
  });

  it(`appends code on eject`, async () => {
    const exp: ExpoConfig = {
      slug: '',
      name: '',
      android: {
        splash: {
          resizeMode: 'native',
        },
      },
    };
    const mainActivity = await AndroidConfig.Paths.getMainActivityAsync('/app');
    let contents = fs.readFileSync(mainActivity.path).toString();
    contents = await setSplashScreenLegacyMainActivity(exp, contents, mainActivity.language);
    expect(contents).toMatch(
      /SplashScreen.show\(this, SplashScreenImageResizeMode\.NATIVE, ReactRootView\.class, false\);/
    );
    // Try it twice...
    const nextContents = await setSplashScreenLegacyMainActivity(
      exp,
      contents,
      mainActivity.language
    );
    expect(nextContents).toMatch(contents);
  });
});
