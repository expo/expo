import Jimp from 'jimp-compact';
import { vol } from 'memfs';

import fixtures from '../../../__tests__/fixtures/react-native-project';
import { setSplashImageDrawablesAsync } from '../withAndroidSplashImages';

jest.mock('fs');
jest.mock('jimp-compact');

describe(setSplashImageDrawablesAsync, () => {
  const mockImage = {
    bitmap: { width: 100, height: 200 },
    clone: jest.fn().mockReturnThis(),
    resize: jest.fn().mockReturnThis(),
    blit: jest.fn().mockReturnThis(),
    quality: jest.fn().mockReturnThis(),
    writeAsync: jest.fn().mockImplementation(async (outputPath) => {
      vol.writeFileSync(outputPath, '...');
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Jimp.read.mockResolvedValue(mockImage);
    Jimp.create.mockResolvedValue(mockImage);
  });

  beforeAll(async () => {
    vol.fromJSON(
      {
        ...fixtures,
        'assets/splash.png': '...',
        'assets/splash-dark.png': '...',
      },
      './'
    );
  });

  afterAll(async () => {
    vol.reset();
  });

  it(`sets all images`, async () => {
    await setSplashImageDrawablesAsync(
      {
        android: {
          splash: {
            resizeMode: 'contain',
            backgroundColor: '#ff0000',
            mdpi: './assets/splash.png',
            hdpi: './assets/splash.png',
            xhdpi: './assets/splash.png',
            xxhdpi: './assets/splash.png',
            xxxhdpi: './assets/splash.png',
            dark: {
              backgroundColor: '#ff00ff',
              mdpi: './assets/splash-dark.png',
              hdpi: './assets/splash-dark.png',
              xhdpi: './assets/splash-dark.png',
              xxhdpi: './assets/splash-dark.png',
              xxxhdpi: './assets/splash-dark.png',
            },
          },
        },
      },
      null,
      '/',
      100
    );

    const images = [
      '/android/app/src/main/res/drawable-mdpi/splashscreen_logo.png',
      '/android/app/src/main/res/drawable-hdpi/splashscreen_logo.png',
      '/android/app/src/main/res/drawable-xhdpi/splashscreen_logo.png',
      '/android/app/src/main/res/drawable-xxhdpi/splashscreen_logo.png',
      '/android/app/src/main/res/drawable-xxxhdpi/splashscreen_logo.png',
      // Dark images
      '/android/app/src/main/res/drawable-night-mdpi/splashscreen_logo.png',
      '/android/app/src/main/res/drawable-night-hdpi/splashscreen_logo.png',
      '/android/app/src/main/res/drawable-night-xhdpi/splashscreen_logo.png',
      '/android/app/src/main/res/drawable-night-xxhdpi/splashscreen_logo.png',
      '/android/app/src/main/res/drawable-night-xxxhdpi/splashscreen_logo.png',
    ];
    const results = vol.toJSON();
    // expect(results).toBe({});
    for (const image of images) {
      expect(results[image]).toBe('...');
    }
  });
  it(`sets minimal images`, async () => {
    await setSplashImageDrawablesAsync(
      {
        android: {
          splash: {
            resizeMode: 'contain',
            backgroundColor: '#ff0000',
            image: './assets/splash.png',
            dark: {
              backgroundColor: '#ff00ff',
              image: './assets/splash-dark.png',
            },
          },
        },
      },
      null,
      '/',
      100
    );

    const images = [
      '/android/app/src/main/res/drawable-mdpi/splashscreen_logo.png',
      '/android/app/src/main/res/drawable-hdpi/splashscreen_logo.png',
      '/android/app/src/main/res/drawable-xhdpi/splashscreen_logo.png',
      '/android/app/src/main/res/drawable-xxhdpi/splashscreen_logo.png',
      '/android/app/src/main/res/drawable-xxxhdpi/splashscreen_logo.png',
      // Dark logos
      '/android/app/src/main/res/drawable-night-mdpi/splashscreen_logo.png',
      '/android/app/src/main/res/drawable-night-hdpi/splashscreen_logo.png',
      '/android/app/src/main/res/drawable-night-xhdpi/splashscreen_logo.png',
      '/android/app/src/main/res/drawable-night-xxhdpi/splashscreen_logo.png',
      '/android/app/src/main/res/drawable-night-xxxhdpi/splashscreen_logo.png',
    ];
    const results = vol.toJSON();
    // expect(results).toBe({});
    for (const image of images) {
      expect(results[image]).toBe('...');
    }
  });
  it(`sets no images`, async () => {
    Jimp.read.mockResolvedValue(null);
    await setSplashImageDrawablesAsync(
      {
        android: {
          splash: {
            resizeMode: 'contain',
            backgroundColor: '#ff0000',
          },
        },
      },
      null,
      './',
      100
    );

    const images = [
      '/android/app/src/main/res/drawable-mdpi/splashscreen_logo.png',
      '/android/app/src/main/res/drawable-hdpi/splashscreen_logo.png',
      '/android/app/src/main/res/drawable-xhdpi/splashscreen_logo.png',
      '/android/app/src/main/res/drawable-xxhdpi/splashscreen_logo.png',
      '/android/app/src/main/res/drawable-xxxhdpi/splashscreen_logo.png',
      // Dark logos
      '/android/app/src/main/res/drawable-night-mdpi/splashscreen_logo.png',
      '/android/app/src/main/res/drawable-night-hdpi/splashscreen_logo.png',
      '/android/app/src/main/res/drawable-night-xhdpi/splashscreen_logo.png',
      '/android/app/src/main/res/drawable-night-xxhdpi/splashscreen_logo.png',
      '/android/app/src/main/res/drawable-night-xxxhdpi/splashscreen_logo.png',
    ];
    const results = vol.toJSON();
    for (const image of images) {
      expect(results[image]).not.toBeDefined();
    }
  });
});
