import { vol } from 'memfs';
import * as path from 'path';

import { ResizeMode } from '../../constants';
import configureDrawableXml from '../Drawable.xml';
import reactNativeProject from './fixtures/react-native-project-structure';

// in `__mocks__/fs.ts` memfs is being used as a mocking library
jest.mock('fs');

describe('Drawable.xml', () => {
  describe('configureDrawableXml', () => {
    beforeEach(() => {
      vol.fromJSON(reactNativeProject, '/app');
    });
    afterEach(() => {
      vol.reset();
    });

    const androidMainPath = '/app/android/app/src/main';
    const filePath = `${androidMainPath}/res/drawable/splashscreen.xml`;
    const fileDirPath = path.dirname(filePath);

    it('creates correct file', async () => {
      await configureDrawableXml(androidMainPath, ResizeMode.NATIVE);
      const actual = vol.readFileSync(filePath, 'utf-8');
      const expected = `<?xml version="1.0" encoding="utf-8"?>
<!--
  This file was created by 'expo-splash-screen' and some of it's content shouldn't be modified by hand
-->
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
  <item android:drawable="@color/splashscreen_background"/>
  <item>
    <bitmap android:gravity="center" android:src="@drawable/splashscreen_image"/>
  </item>
</layer-list>
`;
      expect(actual).toEqual(expected);
    });

    it('updates existing almost empty file', async () => {
      vol.mkdirpSync(fileDirPath);
      vol.writeFileSync(filePath, `<?xml version="1.0" encoding="utf-8"?>`);
      await configureDrawableXml(androidMainPath, ResizeMode.COVER);
      const actual = vol.readFileSync(filePath, 'utf-8');
      const expected = `<?xml version="1.0" encoding="utf-8"?>
<!--
  This file was created by 'expo-splash-screen' and some of it's content shouldn't be modified by hand
-->
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
  <item android:drawable="@color/splashscreen_background"/>
</layer-list>
`;
      expect(actual).toEqual(expected);
    });

    it('removes bitmap element if mode is not NATIVE', async () => {
      vol.mkdirpSync(fileDirPath);
      vol.writeFileSync(
        filePath,
        `<?xml version="1.0" encoding="utf-8"?>
<!--
  This file was created by 'expo-splash-screen' and some of it's content shouldn't be modified by hand
-->
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
  <item android:drawable="@color/splashscreen_background"/>
  <item>
    <bitmap android:gravity="center" android:src="@drawable/splashscreen_image"/>
  </item>
</layer-list>
`
      );
      await configureDrawableXml(androidMainPath, ResizeMode.CONTAIN);
      const actual = vol.readFileSync(filePath, 'utf-8');
      const expected = `<?xml version="1.0" encoding="utf-8"?>
<!--
  This file was created by 'expo-splash-screen' and some of it's content shouldn't be modified by hand
-->
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
  <item android:drawable="@color/splashscreen_background"/>
</layer-list>
`;
      expect(actual).toEqual(expected);
    });
  });
});
