import { vol } from 'memfs';

import configureStylesXml from '../Styles.xml';
import reactNativeProject from './fixtures/react-native-project-structure';

// in `__mocks__/fs.ts` memfs is being used as a mocking library
jest.mock('fs');

describe('Styles.xml', () => {
  describe('configureColorsXml', () => {
    beforeEach(() => {
      vol.fromJSON(reactNativeProject, '/app');
    });
    afterEach(() => {
      vol.reset();
    });

    const androidMainPath = '/app/android/app/src/main';
    const filePath = `${androidMainPath}/res/values/styles.xml`;

    it('creates correct file', async () => {
      vol.unlinkSync(filePath);
      await configureStylesXml(androidMainPath);
      const actual = vol.readFileSync(filePath, 'utf-8');
      const expected = `<?xml version="1.0" encoding="utf-8"?>
<resources>
  <style name="Theme.App.SplashScreen" parent="Theme.AppCompat.Light.NoActionBar">
    <!-- Below line is handled by 'expo-splash-screen' command and it's discouraged to modify it manually -->
    <item name="android:windowBackground">@drawable/splashscreen</item>
    <!-- Customize your splash screen theme here -->
  </style>
</resources>
`;
      expect(actual).toEqual(expected);
    });

    it('updates existing file', async () => {
      await configureStylesXml(androidMainPath);
      const actual = vol.readFileSync(filePath, 'utf-8');
      const expected = `<?xml version="1.0" encoding="utf-8"?>
<resources>
  <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
    <!-- Customize your theme here. -->
    <item name="android:textColor">#000000</item>
  </style>
  <style name="Theme.App.SplashScreen" parent="Theme.AppCompat.Light.NoActionBar">
    <!-- Below line is handled by 'expo-splash-screen' command and it's discouraged to modify it manually -->
    <item name="android:windowBackground">@drawable/splashscreen</item>
    <!-- Customize your splash screen theme here -->
  </style>
</resources>
`;
      expect(actual).toEqual(expected);
    });
  });
});
