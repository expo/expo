import { generateImageAsync } from '@expo/image-utils';
import { ExpoConfig } from 'expo/config';
import {
  AndroidConfig,
  ConfigPlugin,
  withDangerousMod,
  withAndroidColors,
  withAndroidManifest,
} from 'expo/config-plugins';
import { writeFileSync, unlinkSync, copyFileSync, existsSync, mkdirSync } from 'fs';
import { basename, resolve } from 'path';

import { NotificationsPluginProps } from './withNotifications';

const { Colors } = AndroidConfig;

type DPIString = 'mdpi' | 'hdpi' | 'xhdpi' | 'xxhdpi' | 'xxxhdpi';
type dpiMap = Record<DPIString, { folderName: string; scale: number }>;

export const ANDROID_RES_PATH = 'android/app/src/main/res/';
export const dpiValues: dpiMap = {
  mdpi: { folderName: 'mipmap-mdpi', scale: 1 },
  hdpi: { folderName: 'mipmap-hdpi', scale: 1.5 },
  xhdpi: { folderName: 'mipmap-xhdpi', scale: 2 },
  xxhdpi: { folderName: 'mipmap-xxhdpi', scale: 3 },
  xxxhdpi: { folderName: 'mipmap-xxxhdpi', scale: 4 },
};
const {
  addMetaDataItemToMainApplication,
  getMainApplicationOrThrow,
  removeMetaDataItemFromMainApplication,
} = AndroidConfig.Manifest;
const BASELINE_PIXEL_SIZE = 24;
const ERROR_MSG_PREFIX = 'An error occurred while configuring Android notifications. ';
export const META_DATA_NOTIFICATION_ICON = 'expo.modules.notifications.default_notification_icon';
export const META_DATA_NOTIFICATION_ICON_COLOR =
  'expo.modules.notifications.default_notification_color';
export const NOTIFICATION_ICON = 'notification_icon';
export const NOTIFICATION_ICON_RESOURCE = `@drawable/${NOTIFICATION_ICON}`;
export const NOTIFICATION_ICON_COLOR = 'notification_icon_color';
export const NOTIFICATION_ICON_COLOR_RESOURCE = `@color/${NOTIFICATION_ICON_COLOR}`;

export const withNotificationIcons: ConfigPlugin<{ icon: string | null }> = (config, { icon }) => {
  // If no icon provided in the config plugin props, fallback to value from app.json
  icon = icon || getNotificationIcon(config);
  return withDangerousMod(config, [
    'android',
    async (config) => {
      await setNotificationIconAsync(config.modRequest.projectRoot, icon);
      return config;
    },
  ]);
};

export const withNotificationIconColor: ConfigPlugin<{ color: string | null }> = (
  config,
  { color }
) => {
  // If no color provided in the config plugin props, fallback to value from app.json
  return withAndroidColors(config, (config) => {
    color = color || getNotificationColor(config);
    config.modResults = setNotificationIconColor(color, config.modResults);
    return config;
  });
};

export const withNotificationManifest: ConfigPlugin<{
  icon: string | null;
  color: string | null;
}> = (config, { icon, color }) => {
  // If no icon or color provided in the config plugin props, fallback to value from app.json
  icon = icon || getNotificationIcon(config);
  color = color || getNotificationColor(config);
  return withAndroidManifest(config, (config) => {
    config.modResults = setNotificationConfig({ icon, color }, config.modResults);
    return config;
  });
};

export const withNotificationSounds: ConfigPlugin<{ sounds: string[] }> = (config, { sounds }) => {
  return withDangerousMod(config, [
    'android',
    (config) => {
      setNotificationSounds(config.modRequest.projectRoot, sounds);
      return config;
    },
  ]);
};

export function getNotificationIcon(config: ExpoConfig) {
  return config.notification?.icon || null;
}

export function getNotificationColor(config: ExpoConfig) {
  return config.notification?.color || null;
}

export function setNotificationIconColor(
  color: string | null,
  colors: AndroidConfig.Resources.ResourceXML
) {
  return Colors.assignColorValue(colors, {
    name: NOTIFICATION_ICON_COLOR,
    value: color,
  });
}

/**
 * Applies notification icon configuration for expo-notifications
 */
export async function setNotificationIconAsync(projectRoot: string, icon: string | null) {
  if (icon) {
    await writeNotificationIconImageFilesAsync(icon, projectRoot);
  } else {
    removeNotificationIconImageFiles(projectRoot);
  }
}

function setNotificationConfig(
  props: { icon: string | null; color: string | null },
  manifest: AndroidConfig.Manifest.AndroidManifest
) {
  const mainApplication = getMainApplicationOrThrow(manifest);
  if (props.icon) {
    addMetaDataItemToMainApplication(
      mainApplication,
      META_DATA_NOTIFICATION_ICON,
      NOTIFICATION_ICON_RESOURCE,
      'resource'
    );
  } else {
    removeMetaDataItemFromMainApplication(mainApplication, META_DATA_NOTIFICATION_ICON);
  }
  if (props.color) {
    addMetaDataItemToMainApplication(
      mainApplication,
      META_DATA_NOTIFICATION_ICON_COLOR,
      NOTIFICATION_ICON_COLOR_RESOURCE,
      'resource'
    );
  } else {
    removeMetaDataItemFromMainApplication(mainApplication, META_DATA_NOTIFICATION_ICON_COLOR);
  }
  return manifest;
}

async function writeNotificationIconImageFilesAsync(icon: string, projectRoot: string) {
  await Promise.all(
    Object.values(dpiValues).map(async ({ folderName, scale }) => {
      const drawableFolderName = folderName.replace('mipmap', 'drawable');
      const dpiFolderPath = resolve(projectRoot, ANDROID_RES_PATH, drawableFolderName);
      if (!existsSync(dpiFolderPath)) {
        mkdirSync(dpiFolderPath, { recursive: true });
      }
      const iconSizePx = BASELINE_PIXEL_SIZE * scale;

      try {
        const resizedIcon = (
          await generateImageAsync(
            { projectRoot, cacheType: 'android-notification' },
            {
              src: icon,
              width: iconSizePx,
              height: iconSizePx,
              resizeMode: 'cover',
              backgroundColor: 'transparent',
            }
          )
        ).source;
        writeFileSync(resolve(dpiFolderPath, NOTIFICATION_ICON + '.png'), resizedIcon);
      } catch (e) {
        throw new Error(
          ERROR_MSG_PREFIX + 'Encountered an issue resizing Android notification icon: ' + e
        );
      }
    })
  );
}

function removeNotificationIconImageFiles(projectRoot: string) {
  Object.values(dpiValues).forEach(async ({ folderName }) => {
    const drawableFolderName = folderName.replace('mipmap', 'drawable');
    const dpiFolderPath = resolve(projectRoot, ANDROID_RES_PATH, drawableFolderName);
    const iconFile = resolve(dpiFolderPath, NOTIFICATION_ICON + '.png');
    if (existsSync(iconFile)) {
      unlinkSync(iconFile);
    }
  });
}

/**
 * Save sound files to `<project-root>/android/app/src/main/res/raw`
 */
export function setNotificationSounds(projectRoot: string, sounds: string[]) {
  if (!Array.isArray(sounds)) {
    throw new Error(
      ERROR_MSG_PREFIX +
        `Must provide an array of sound files in your app config, found ${typeof sounds}.`
    );
  }
  for (const soundFileRelativePath of sounds) {
    writeNotificationSoundFile(soundFileRelativePath, projectRoot);
  }
}

/**
 * Copies the input file to the `<project-root>/android/app/src/main/res/raw` directory if
 * there isn't already an existing file under that name.
 */
function writeNotificationSoundFile(soundFileRelativePath: string, projectRoot: string) {
  const rawResourcesPath = resolve(projectRoot, ANDROID_RES_PATH, 'raw');
  const inputFilename = basename(soundFileRelativePath);

  if (inputFilename) {
    try {
      const sourceFilepath = resolve(projectRoot, soundFileRelativePath);
      const destinationFilepath = resolve(rawResourcesPath, inputFilename);
      if (!existsSync(rawResourcesPath)) {
        mkdirSync(rawResourcesPath, { recursive: true });
      }
      copyFileSync(sourceFilepath, destinationFilepath);
    } catch (e) {
      throw new Error(
        ERROR_MSG_PREFIX + 'Encountered an issue copying Android notification sounds: ' + e
      );
    }
  }
}

export const withNotificationsAndroid: ConfigPlugin<NotificationsPluginProps> = (
  config,
  { icon = null, color = null, sounds = [] }
) => {
  config = withNotificationIconColor(config, { color });
  config = withNotificationIcons(config, { icon });
  config = withNotificationManifest(config, { icon, color });
  config = withNotificationSounds(config, { sounds });
  return config;
};
