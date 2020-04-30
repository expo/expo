import { vol, fs } from 'memfs';
import * as path from 'path';

import { getDirFromFS } from '../../__tests__/helpers';
import configureDrawables from '../Drawables';
import reactNativeProject from './fixtures/react-native-project-structure';

// in `__mocks__/fs.ts` memfs is being used as a mocking library
jest.mock('fs');
const actualFs = jest.requireActual('fs') as typeof fs;

describe('Drawables', () => {
  describe('configureDrawables', () => {
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

    const androidMainPath = '/app/android/app/src/main';
    const filePath = `${androidMainPath}/res/drawable/splashscreen_image.png`;

    it('create correct file', async () => {
      await configureDrawables(androidMainPath, '/assets/background.png');
      const received = getDirFromFS(vol.toJSON(), '/app');
      const expected = {
        ...reactNativeProject,
        [filePath.replace('/app/', '')]: backgroundImage,
      };
      expect(received).toEqual(expected);
    });

    it('removes all SplashScreen images', async () => {
      for (const dir of [
        'drawable',
        'drawable-mdpi',
        'drawable-hdpi',
        'drawable-xhdpi',
        'drawable-xxhdpi',
        'drawable-xxxhdpi',
      ]) {
        const filePath = path.resolve(androidMainPath, 'res', dir, 'splashscreen_image.png');
        vol.mkdirpSync(path.dirname(filePath));
        vol.writeFileSync(filePath, backgroundImage);
      }
      await configureDrawables(androidMainPath, '/assets/background.png');
      const received = getDirFromFS(vol.toJSON(), '/app');
      const expected = {
        ...reactNativeProject,
        [filePath.replace('/app/', '')]: backgroundImage,
      };
      expect(received).toEqual(expected);
    });
  });
});
