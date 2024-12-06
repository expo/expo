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
const SPLASH_SCREEN_DRAWABLE_NAME = 'splashscreen_logo.xml';

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
        path: `./res/drawable/${SPLASH_SCREEN_DRAWABLE_NAME}`,
      },
      dark: {
        path: `./res/drawable-night/${SPLASH_SCREEN_DRAWABLE_NAME}`,
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
        props?.imageWidth ?? 200
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
  imageWidth: number
) {
  await clearAllExistingSplashImagesAsync(projectRoot);

  const splash = getAndroidSplashConfig(config, props);
  const darkSplash = getAndroidDarkSplashConfig(config, props);

  await Promise.all([
    setSplashImageDrawablesForThemeAsync(splash, 'light', projectRoot, imageWidth),
    setSplashImageDrawablesForThemeAsync(darkSplash, 'dark', projectRoot, imageWidth),
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
  imageWidth: number = 100
) {
  if (!config) return;
  const androidMainPath = path.join(projectRoot, 'android/app/src/main');

  if (config.drawable) {
    await writeSplashScreenDrawables(androidMainPath, projectRoot, config.drawable);
    return;
  }

  const sizes: DRAWABLE_SIZE[] = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];

  await Promise.all(
    sizes.map(async (imageKey) => {
      // @ts-ignore
      const image = config[imageKey];

      if (image) {
        const multiplier = DRAWABLES_CONFIGS[imageKey].dimensionsMultiplier;
        const size = imageWidth * multiplier; // "imageWidth" must be replaced by the logo width chosen by the user in its config file
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

async function writeSplashScreenDrawables(
  drawablePath: string,
  projectRoot: string,
  drawable: SplashScreenConfig['drawable']
) {
  if (!drawable) {
    return;
  }

  const lightDrawablePath = path.join(drawablePath, DRAWABLES_CONFIGS.default.modes.light.path);
  const darkDrawablePath = path.join(drawablePath, DRAWABLES_CONFIGS.default.modes.dark.path);

  const lightFolder = path.dirname(lightDrawablePath);
  await fs.ensureDir(lightFolder);
  await fs.copyFile(path.join(projectRoot, drawable.icon), lightDrawablePath);

  if (drawable.darkIcon) {
    const darkFolder = path.dirname(darkDrawablePath);
    await fs.ensureDir(darkFolder);
    await fs.copyFile(path.join(projectRoot, drawable.darkIcon), darkDrawablePath);
  }
}
