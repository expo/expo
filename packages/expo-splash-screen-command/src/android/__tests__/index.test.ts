import * as colorString from 'color-string';
import { vol, fs } from 'memfs';
import * as path from 'path';

import { getDirFromFS } from '../../__tests__/helpers';
import { ResizeMode } from '../../constants';
import configureAndroid from '../index';
import reactNativeProject from './fixtures/react-native-project-structure';
import reactNativeProjectWithSplashScreenConfiured from './fixtures/react-native-project-structure-with-splash-screen-configured';

// in `__mocks__/fs.ts` memfs is being used as a mocking library
jest.mock('fs');
const actualFs = jest.requireActual('fs') as typeof fs;

describe('android', () => {
  describe('configureAndroid', () => {
    beforeEach(() => {
      vol.fromJSON(reactNativeProject, '/app');
    });
    afterEach(() => {
      vol.reset();
    });

    it('configures project correctly with defaults', async () => {
      await configureAndroid('/app', {
        resizeMode: ResizeMode.CONTAIN,
        backgroundColor: colorString.get('#E3F29238'),
      });

      const received = getDirFromFS(vol.toJSON(), '/app');
      expect(received).toEqual(reactNativeProjectWithSplashScreenConfiured);
    });

    it('reconfigures project with ResizeMode.NATIVE', async () => {
      vol.fromJSON(reactNativeProjectWithSplashScreenConfiured, '/app');
      await configureAndroid('/app', {
        resizeMode: ResizeMode.NATIVE,
        backgroundColor: colorString.get('rgba(35, 123, 217, 0.5)'),
      });
      const received = getDirFromFS(vol.toJSON(), '/app');
      const expected = {
        ...reactNativeProjectWithSplashScreenConfiured,
        'android/app/src/main/java/com/reactnativeproject/MainActivity.java': reactNativeProjectWithSplashScreenConfiured[
          'android/app/src/main/java/com/reactnativeproject/MainActivity.java'
        ].replace('CONTAIN', 'NATIVE'),
        'android/app/src/main/res/drawable/splashscreen.xml': reactNativeProjectWithSplashScreenConfiured[
          'android/app/src/main/res/drawable/splashscreen.xml'
        ].replace(
          /(?<=<item.*\/>\n)/m,
          '  <item>\n    <bitmap android:gravity="center" android:src="@drawable/splashscreen_image"/>\n  </item>\n'
        ),
        'android/app/src/main/res/values/colors.xml': reactNativeProjectWithSplashScreenConfiured[
          'android/app/src/main/res/values/colors.xml'
        ].replace('#E3F29238', '#237BD980'),
      };

      expect(received).toEqual(expected);
    });

    it('configures project with an image and ResizeMode.COVER', async () => {
      const backgroundImagePath = path.resolve(
        __dirname,
        '../../__tests__/fixtures/background.png'
      );
      const backgroundImage = await new Promise<Buffer | string>((resolve, reject) =>
        actualFs.readFile(backgroundImagePath, 'utf-8', (error, data) => {
          if (error) reject(error);
          else resolve(data);
        })
      );

      vol.fromJSON(reactNativeProjectWithSplashScreenConfiured, '/app');
      vol.mkdirpSync('/assets');
      vol.writeFileSync('/assets/background.png', backgroundImage);
      await configureAndroid('/app', {
        resizeMode: ResizeMode.COVER,
        backgroundColor: colorString.get('yellow'),
        imagePath: '/assets/background.png',
      });
      const received = getDirFromFS(vol.toJSON(), '/app');
      const expected = {
        ...reactNativeProjectWithSplashScreenConfiured,
        'android/app/src/main/java/com/reactnativeproject/MainActivity.java': reactNativeProjectWithSplashScreenConfiured[
          'android/app/src/main/java/com/reactnativeproject/MainActivity.java'
        ].replace('CONTAIN', 'COVER'),
        'android/app/src/main/res/values/colors.xml': reactNativeProjectWithSplashScreenConfiured[
          'android/app/src/main/res/values/colors.xml'
        ].replace('#E3F29238', '#FFFF00'),
        'android/app/src/main/res/drawable/splashscreen_image.png': backgroundImage,
      };
      expect(received).toEqual(expected);
    });
  });
});
