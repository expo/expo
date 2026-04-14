import {
  generateImageAsync,
  compositeImagesAsync,
  generateImageBackgroundAsync,
} from '@expo/image-utils';
import { ConfigPlugin, withDangerousMod } from 'expo/config-plugins';
import fs from 'fs';
import path from 'path';

import { AndroidSplashConfig, BaseAndroidSplashConfig } from './types';

type DrawableSize = 'default' | 'mdpi' | 'hdpi' | 'xhdpi' | 'xxhdpi' | 'xxxhdpi';

const IMAGE_CACHE_NAME = 'splash-android';
const SPLASH_SCREEN_FILENAME = 'splashscreen_logo.png';
const SPLASH_SCREEN_DRAWABLE_NAME = 'splashscreen_logo.xml';

const DRAWABLES_CONFIGS: Record<
  DrawableSize,
  {
    lightPath: string;
    darkPath: string;
    multiplier: number;
  }
> = {
  default: {
    lightPath: `./res/drawable/${SPLASH_SCREEN_DRAWABLE_NAME}`,
    darkPath: `./res/drawable-night/${SPLASH_SCREEN_DRAWABLE_NAME}`,
    multiplier: 1,
  },
  mdpi: {
    lightPath: `./res/drawable-mdpi/${SPLASH_SCREEN_FILENAME}`,
    darkPath: `./res/drawable-night-mdpi/${SPLASH_SCREEN_FILENAME}`,
    multiplier: 1,
  },
  hdpi: {
    lightPath: `./res/drawable-hdpi/${SPLASH_SCREEN_FILENAME}`,
    darkPath: `./res/drawable-night-hdpi/${SPLASH_SCREEN_FILENAME}`,
    multiplier: 1.5,
  },
  xhdpi: {
    lightPath: `./res/drawable-xhdpi/${SPLASH_SCREEN_FILENAME}`,
    darkPath: `./res/drawable-night-xhdpi/${SPLASH_SCREEN_FILENAME}`,
    multiplier: 2,
  },
  xxhdpi: {
    lightPath: `./res/drawable-xxhdpi/${SPLASH_SCREEN_FILENAME}`,
    darkPath: `./res/drawable-night-xxhdpi/${SPLASH_SCREEN_FILENAME}`,
    multiplier: 3,
  },
  xxxhdpi: {
    lightPath: `./res/drawable-xxxhdpi/${SPLASH_SCREEN_FILENAME}`,
    darkPath: `./res/drawable-night-xxxhdpi/${SPLASH_SCREEN_FILENAME}`,
    multiplier: 4,
  },
};

export const withAndroidSplashImages: ConfigPlugin<AndroidSplashConfig> = (config, splash) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      await setSplashImageDrawablesAsync(splash, config.modRequest.projectRoot);
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
  { dark, drawable, ...root }: AndroidSplashConfig,
  projectRoot: string
) {
  await clearAllExistingSplashImagesAsync(projectRoot);

  if (drawable != null) {
    await writeSplashScreenDrawablesAsync(projectRoot, drawable);
  } else {
    await Promise.all([
      setSplashImageDrawablesForThemeAsync(root, 'light', projectRoot, root.imageWidth),
      setSplashImageDrawablesForThemeAsync(dark, 'dark', projectRoot, root.imageWidth),
    ]);
  }
}

async function clearAllExistingSplashImagesAsync(projectRoot: string) {
  const androidMainPath = path.join(projectRoot, 'android/app/src/main');

  const paths = Object.values(DRAWABLES_CONFIGS)
    .map(({ lightPath, darkPath }) => [lightPath, darkPath])
    .flat();

  await Promise.all(
    paths.map((filePath) => {
      return fs.promises.rm(path.resolve(androidMainPath, filePath), {
        force: true,
        recursive: true,
      });
    })
  );
}

export async function setSplashImageDrawablesForThemeAsync(
  config: BaseAndroidSplashConfig | undefined,
  theme: 'dark' | 'light',
  projectRoot: string,
  imageWidth: number
) {
  if (!config) {
    return;
  }

  const androidMainPath = path.join(projectRoot, 'android/app/src/main');
  const sizes: Exclude<DrawableSize, 'default'>[] = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];

  await Promise.all(
    sizes.map(async (sizeKey) => {
      const image = config[sizeKey];

      if (image) {
        const drawableConfig = DRAWABLES_CONFIGS[sizeKey];

        const { multiplier } = drawableConfig;
        const size = imageWidth * multiplier; // "imageWidth" must be replaced by the logo width chosen by the user in its config file
        const canvasSize = 288 * multiplier;

        const background = await generateImageBackgroundAsync({
          width: canvasSize,
          height: canvasSize,
          backgroundColor: 'transparent',
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
          theme === 'light' ? drawableConfig.lightPath : drawableConfig.darkPath
        );

        const folder = path.dirname(outputPath);
        // Ensure directory exists.
        await fs.promises.mkdir(folder, { recursive: true });
        await fs.promises.writeFile(outputPath, composedImage);
      }
    })
  );
}

async function writeSplashScreenDrawablesAsync(
  projectRoot: string,
  drawable: NonNullable<AndroidSplashConfig['drawable']>
) {
  const androidMainPath = path.join(projectRoot, 'android/app/src/main');
  const lightDrawablePath = path.join(androidMainPath, DRAWABLES_CONFIGS.default.lightPath);
  const darkDrawablePath = path.join(androidMainPath, DRAWABLES_CONFIGS.default.darkPath);

  const lightFolder = path.dirname(lightDrawablePath);
  await fs.promises.mkdir(lightFolder, { recursive: true });
  await fs.promises.copyFile(path.join(projectRoot, drawable.icon), lightDrawablePath);

  if (drawable.darkIcon) {
    const darkFolder = path.dirname(darkDrawablePath);
    await fs.promises.mkdir(darkFolder, { recursive: true });
    await fs.promises.copyFile(path.join(projectRoot, drawable.darkIcon), darkDrawablePath);
  }
}
