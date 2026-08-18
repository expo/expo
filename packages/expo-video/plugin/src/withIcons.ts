import { generateImageAsync } from '@expo/image-utils';
import { ConfigPlugin, withDangerousMod } from 'expo/config-plugins';
import { writeFileSync, unlinkSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { basename, resolve } from 'path';

const BASELINE_PIXEL_SIZE = 96;
const ERROR_MSG_PREFIX = 'An error occurred while configuring Android expo-video icons.';

const ANDROID_DRAWABLE_PATH = 'android/app/src/main/res/drawable/';
const EXPO_VIDEO_ICON_PREFIX = 'expo_video_icon_';

async function writeIconAsync(icon: string, projectRoot: string) {
  const drawableFolderPath = resolve(projectRoot, ANDROID_DRAWABLE_PATH);

  if (!existsSync(drawableFolderPath)) {
    mkdirSync(drawableFolderPath, { recursive: true });
  }

  try {
    const resizedIcon = (
      await generateImageAsync(
        { projectRoot, cacheType: 'expo-video-android-icon' },
        {
          src: icon,
          width: BASELINE_PIXEL_SIZE,
          height: BASELINE_PIXEL_SIZE,
          resizeMode: 'cover',
          backgroundColor: 'transparent',
        }
      )
    ).source;

    const originalIconName = basename(icon);
    const iconFilename = `${EXPO_VIDEO_ICON_PREFIX}${originalIconName}`;
    writeFileSync(resolve(drawableFolderPath, iconFilename), resizedIcon);
  } catch (e) {
    throw new Error(ERROR_MSG_PREFIX + 'Encountered an issue resizing icon: ' + e);
  }
}

async function removeIconImageFiles(projectRoot: string) {
  const drawableFolderPath = resolve(projectRoot, ANDROID_DRAWABLE_PATH);

  if (!existsSync(drawableFolderPath)) {
    return;
  }

  readdirSync(drawableFolderPath).forEach((file) => {
    if (file.startsWith(EXPO_VIDEO_ICON_PREFIX)) {
      unlinkSync(resolve(drawableFolderPath, file));
    }
  });
}

export const withIcons: ConfigPlugin<{ icons?: string[] }> = (config, { icons = [] }) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      if (icons.length) {
        await Promise.all(icons.map((icon) => writeIconAsync(icon, config.modRequest.projectRoot)));
      } else {
        await removeIconImageFiles(config.modRequest.projectRoot);
      }

      return config;
    },
  ]);
};
