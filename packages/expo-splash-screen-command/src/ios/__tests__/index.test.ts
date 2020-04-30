import colorString from 'color-string';
import { vol, fs } from 'memfs';
import * as path from 'path';

import { getDirFromFS } from '../../__tests__/helpers';
import { ResizeMode } from '../../constants';
import configureIos from '../index';
import reactNativeProject from './fixtures/react-native-project-structure';
import reactNativeProjectWithSplashScreenConfiured from './fixtures/react-native-project-structure-with-splash-screen-configured';

// in `__mocks__/fs.ts` memfs is being used as a mocking library
jest.mock('fs');
const actualFs = jest.requireActual('fs') as typeof fs;
// in `__mocks__/xcode.ts` parsing job for `.pbxproj` is performed synchronously on single tread
jest.mock('xcode');

describe('ios', () => {
  describe('configureIos', () => {
    beforeEach(() => {
      vol.fromJSON(reactNativeProject, '/app');
    });
    afterEach(() => {
      vol.reset();
    });

    it('configures project correctly with defaults', async () => {
      await configureIos('/app', {
        resizeMode: ResizeMode.CONTAIN,
        backgroundColor: colorString.get('#E3F29238'),
      });
      const received = getDirFromFS(vol.toJSON(), '/app');
      // I don't compare `.pbxproj` as every time it is filled with new UUIDs
      delete received['ios/ReactNativeProject.xcodeproj/project.pbxproj'];
      expect(received).toEqual(reactNativeProjectWithSplashScreenConfiured);
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
      await configureIos('/app', {
        resizeMode: ResizeMode.COVER,
        backgroundColor: colorString.get('yellow'),
        imagePath: '/assets/background.png',
      });
      const received = getDirFromFS(vol.toJSON(), '/app');
      // I don't compare `.pbxproj` as every time it is filled with new UUIDs
      delete received['ios/ReactNativeProject.xcodeproj/project.pbxproj'];
      const expected = {
        ...reactNativeProjectWithSplashScreenConfiured,
        'ios/ReactNativeProject/Images.xcassets/SplashScreen.imageset/splashscreen.png': backgroundImage,
        'ios/ReactNativeProject/Images.xcassets/SplashScreen.imageset/Contents.json': `{
  "images": [
    {
      "idiom": "universal",
      "filename": "splashscreen.png",
      "scale": "1x"
    },
    {
      "idiom": "universal",
      "scale": "2x"
    },
    {
      "idiom": "universal",
      "scale": "3x"
    }
  ],
  "info": {
    "version": 1,
    "author": "xcode"
  }
}`,
        'ios/ReactNativeProject/SplashScreen.storyboard': reactNativeProjectWithSplashScreenConfiured[
          'ios/ReactNativeProject/SplashScreen.storyboard'
        ]
          .replace(/(?<=verticalHuggingPriority="251")/, '\n            image="SplashScreen"')
          .replace('scaleAspectFit', 'scaleAspectFill')
          .replace(
            '<color key="backgroundColor" red="0.8901960784313725" green="0.9490196078431372" blue="0.5725490196078431" alpha="0.22" colorSpace="custom" customColorSpace="sRGB"/>',
            '<color key="backgroundColor" red="1" green="1" blue="0" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>'
          ),
      };
      expect(received).toEqual(expected);
    });
  });
});
