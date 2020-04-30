import { vol, fs } from 'memfs';
import * as path from 'path';

import configureAssets from '../Assets';
import reactNativeProject from './fixtures/react-native-project-structure';

// in `__mocks__/fs.ts` memfs is being used as a mocking library
jest.mock('fs');
const actualFs = jest.requireActual('fs') as typeof fs;

describe('Assets', () => {
  describe('configureAssets', () => {
    const backgroundImagePath = path.resolve(__dirname, '../../__tests__/fixtures/background.png');
    let backgroundImage: string | Buffer = '';
    beforeAll(async () => {
      backgroundImage = await new Promise<Buffer | string>((resolve, reject) =>
        actualFs.readFile(backgroundImagePath, 'utf-8', (error, data) => {
          if (error) reject(error);
          else resolve(data);
        })
      );
    });

    beforeEach(() => {
      vol.fromJSON(reactNativeProject, '/app');
      vol.mkdirpSync('/assets');
      vol.writeFileSync('/assets/background.png', backgroundImage);
    });
    afterEach(() => {
      vol.reset();
    });

    const iosProjectPath = `/app/ios/ReactNativeProject`;

    it(`creates correct files when there's an image`, async () => {
      await configureAssets(iosProjectPath, '/assets/background.png');
      const imageResult = vol.readFileSync(
        `${iosProjectPath}/Images.xcassets/SplashScreen.imageset/splashscreen.png`,
        'utf-8'
      );
      const imageSetResult = vol.readFileSync(
        `${iosProjectPath}/Images.xcassets/SplashScreen.imageset/Contents.json`,
        'utf-8'
      );
      expect(imageResult).toEqual(backgroundImage);
      expect(imageSetResult).toEqual(`{
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
}`);
    });

    it(`cleans files if there's no image`, async () => {
      await configureAssets(iosProjectPath, '/assets/background.png');
      await configureAssets(iosProjectPath);
      const imageResult = vol.existsSync(
        `${iosProjectPath}/Images.xcassets/SplashScreen.imageset/splashscreen.png`
      );
      const imageSetResult = vol.existsSync(
        `${iosProjectPath}/Images.xcassets/SplashScreen.imageset/Contents.json`
      );
      expect(imageResult).toEqual(false);
      expect(imageSetResult).toEqual(false);
    });
  });
});
