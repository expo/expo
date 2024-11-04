import { ConfigPlugin, withDangerousMod } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
import {
  generateImageAsync,
  compositeImagesAsync,
  generateImageBackgroundAsync,
} from '@expo/image-utils';
import fs from 'fs-extra';
import path from 'path';

import {
  AndroidSplashConfig,
  getAndroidDarkSplashConfig,
  getAndroidSplashConfig,
  SplashScreenConfig,
} from './getAndroidSplashConfig';

type DRAWABLE_SIZE = 'default' | 'mdpi' | 'hdpi' | 'xhdpi' | 'xxhdpi' | 'xxxhdpi';
type THEME = 'light' | 'dark';

const IMAGE_CACHE_NAME = 'splash-android';
const SPLASH_SCREEN_FILENAME = 'splashscreen_logo.png';
const DRAWABLES_CONFIGS: {
  [key in DRAWABLE_SIZE]: {
    modes: {
      [key in THEME]: {
        path: string;
      };
    };
    dimensionsMultiplier: number;
  };
} = {
  default: {
    modes: {
      light: {
        path: `./res/drawable/${SPLASH_SCREEN_FILENAME}`,
      },
      dark: {
        path: `./res/drawable-night/${SPLASH_SCREEN_FILENAME}`,
      },
    },
    dimensionsMultiplier: 1,
  },
  mdpi: {
    modes: {
      light: {
        path: `./res/drawable-mdpi/${SPLASH_SCREEN_FILENAME}`,
      },
      dark: {
        path: `./res/drawable-night-mdpi/${SPLASH_SCREEN_FILENAME}`,
      },
    },
    dimensionsMultiplier: 1,
  },
  hdpi: {
    modes: {
      light: {
        path: `./res/drawable-hdpi/${SPLASH_SCREEN_FILENAME}`,
      },
      dark: {
        path: `./res/drawable-night-hdpi/${SPLASH_SCREEN_FILENAME}`,
      },
    },
    dimensionsMultiplier: 1.5,
  },
  xhdpi: {
    modes: {
      light: {
        path: `./res/drawable-xhdpi/${SPLASH_SCREEN_FILENAME}`,
      },
      dark: {
        path: `./res/drawable-night-xhdpi/${SPLASH_SCREEN_FILENAME}`,
      },
    },
    dimensionsMultiplier: 2,
  },
  xxhdpi: {
    modes: {
      light: {
        path: `./res/drawable-xxhdpi/${SPLASH_SCREEN_FILENAME}`,
      },
      dark: {
        path: `./res/drawable-night-xxhdpi/${SPLASH_SCREEN_FILENAME}`,
      },
    },
    dimensionsMultiplier: 3,
  },
  xxxhdpi: {
    modes: {
      light: {
        path: `./res/drawable-xxxhdpi/${SPLASH_SCREEN_FILENAME}`,
      },
      dark: {
        path: `./res/drawable-night-xxxhdpi/${SPLASH_SCREEN_FILENAME}`,
      },
    },
    dimensionsMultiplier: 4,
  },
};

export const withAndroidSplashImages: ConfigPlugin<AndroidSplashConfig> = (config, props) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      await setSplashImageDrawablesAsync(
        config,
        props,
        config.modRequest.projectRoot,
        props?.logoWidth ?? 100
      );
      return config;
    },
  ]);
};

/**
 * Deletes all previous splash_screen_images and copies new one to desired drawable directory.
 * If path isn't provided then no new image is placed in drawable directories.
 * @see https://developer.android.com/training/multiscreen/screendensities
 *
 * @param androidMainPath Absolute path to the main directory containing code and resources in Android project. In general that would be `android/app/src/main`.
 */
export async function setSplashImageDrawablesAsync(
  config: Pick<ExpoConfig, 'android' | 'splash'>,
  props: AndroidSplashConfig | null,
  projectRoot: string,
  logoWidth: number
) {
  await clearAllExistingSplashImagesAsync(projectRoot);

  const splash = getAndroidSplashConfig(config, props);
  const darkSplash = getAndroidDarkSplashConfig(config, props);

  await Promise.all([
    setSplashImageDrawablesForThemeAsync(splash, 'light', projectRoot, logoWidth),
    setSplashImageDrawablesForThemeAsync(darkSplash, 'dark', projectRoot, logoWidth),
  ]);
}

async function clearAllExistingSplashImagesAsync(projectRoot: string) {
  const androidMainPath = path.join(projectRoot, 'android/app/src/main');

  await Promise.all(
    Object.values(DRAWABLES_CONFIGS).map(async ({ modes }) => {
      await Promise.all(
        Object.values(modes).map(async ({ path: filePath }) => {
          if (await fs.pathExists(path.resolve(androidMainPath, filePath))) {
            await fs.remove(path.resolve(androidMainPath, filePath));
          }
        })
      );
    })
  );
}

export async function setSplashImageDrawablesForThemeAsync(
  config: SplashScreenConfig | null,
  theme: 'dark' | 'light',
  projectRoot: string,
  logoWidth: number
) {
  if (!config) return;
  const androidMainPath = path.join(projectRoot, 'android/app/src/main');

  const sizes: DRAWABLE_SIZE[] = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];

  await Promise.all(
    sizes.map(async (imageKey) => {
      // @ts-ignore
      const image = config[imageKey];

      if (image) {
        const multiplier = DRAWABLES_CONFIGS[imageKey].dimensionsMultiplier;
        const size = logoWidth * multiplier; // "logoWidth" must be replaced by the logo width chosen by the user in its config file
        const canvasSize = 288 * multiplier;

        const background = await generateImageBackgroundAsync({
          width: canvasSize,
          height: canvasSize,
          backgroundColor: config.backgroundColor ?? 'transparent',
          resizeMode: 'cover',
        });

        const { source: foreground } = await generateImageAsync(
          {
            projectRoot,
            cacheType: IMAGE_CACHE_NAME,
          },
          {
            src: image,
            resizeMode: 'contain',
            width: size,
            height: size,
          }
        );

        const composedImage = await compositeImagesAsync({
          background,
          foreground,
          x: (canvasSize - size) / 2,
          y: (canvasSize - size) / 2,
        });

        // Get output path for drawable.
        const outputPath = path.join(
          androidMainPath,
          DRAWABLES_CONFIGS[imageKey].modes[theme].path
        );

        const folder = path.dirname(outputPath);
        // Ensure directory exists.
        await fs.ensureDir(folder);
        await fs.writeFile(outputPath, composedImage);
      }
      return null;
    })
  );
}
