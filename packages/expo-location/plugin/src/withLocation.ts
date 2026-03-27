import { generateImageAsync } from '@expo/image-utils';
import {
  AndroidConfig,
  ConfigPlugin,
  IOSConfig,
  createRunOncePlugin,
  withInfoPlist,
  withDangerousMod,
  withAndroidManifest,
} from 'expo/config-plugins';
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const pkg = require('../../package.json');
const LOCATION_USAGE = 'Allow $(PRODUCT_NAME) to access your location';

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
const ERROR_MSG_PREFIX = 'An error occurred while configuring Android location. ';

export const FOREGROUND_SERVICE_ICON = 'location_foreground_service_icon';
export const FOREGROUND_SERVICE_ICON_RESOURCE = `@drawable/${FOREGROUND_SERVICE_ICON}`;
export const META_DATA_FOREGROUND_SERVICE_ICON = 'expo.modules.location.foreground_service_icon';

const withBackgroundLocation: ConfigPlugin = (config) => {
  return withInfoPlist(config, (config) => {
    if (!Array.isArray(config.modResults.UIBackgroundModes)) {
      config.modResults.UIBackgroundModes = [];
    }
    if (!config.modResults.UIBackgroundModes.includes('location')) {
      config.modResults.UIBackgroundModes.push('location');
    }
    return config;
  });
};

export const withForegroundServiceIcon: ConfigPlugin<{ icon: string | null }> = (
  config,
  { icon }
) => {
  // Update icon assets
  const configWithIconAssets = withDangerousMod(config, [
    'android',
    async (config) => {
      await setForegroundServiceIconAsync(config.modRequest.projectRoot, icon);
      return config;
    },
  ]);

  // Update assets Android manifest
  return withAndroidManifest(configWithIconAssets, (config) => {
    const manifest = config.modResults;
    const mainApplication = getMainApplicationOrThrow(manifest);

    if (icon) {
      addMetaDataItemToMainApplication(
        mainApplication,
        META_DATA_FOREGROUND_SERVICE_ICON,
        FOREGROUND_SERVICE_ICON_RESOURCE,
        'resource'
      );
    } else {
      removeMetaDataItemFromMainApplication(mainApplication, META_DATA_FOREGROUND_SERVICE_ICON);
    }

    config.modResults = manifest;
    return config;
  });
};

/**
 * Applies foreground service icon configuration for expo-location
 */
export async function setForegroundServiceIconAsync(projectRoot: string, icon: string | null) {
  if (icon) {
    await writeForegroundServiceIconImageFilesAsync(icon, projectRoot);
  } else {
    removeForegroundServiceIconImageFiles(projectRoot);
  }
}

async function writeForegroundServiceIconImageFilesAsync(icon: string, projectRoot: string) {
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
            { projectRoot, cacheType: 'android-location' },
            {
              src: icon,
              width: iconSizePx,
              height: iconSizePx,
              resizeMode: 'cover',
              backgroundColor: 'transparent',
            }
          )
        ).source;
        writeFileSync(resolve(dpiFolderPath, FOREGROUND_SERVICE_ICON + '.png'), resizedIcon);
      } catch (e) {
        throw new Error(
          ERROR_MSG_PREFIX + 'Encountered an issue resizing Android foreground service icon: ' + e
        );
      }
    })
  );
}

function removeForegroundServiceIconImageFiles(projectRoot: string) {
  Object.values(dpiValues).forEach(async ({ folderName }) => {
    const drawableFolderName = folderName.replace('mipmap', 'drawable');
    const dpiFolderPath = resolve(projectRoot, ANDROID_RES_PATH, drawableFolderName);
    const iconFile = resolve(dpiFolderPath, FOREGROUND_SERVICE_ICON + '.png');
    if (existsSync(iconFile)) {
      unlinkSync(iconFile);
    }
  });
}

export type Props = {
  /**
   * A string to set the `NSLocationAlwaysAndWhenInUseUsageDescription` permission message.
   * @default "Allow $(PRODUCT_NAME) to use your location"
   * @platform ios
   */
  locationAlwaysAndWhenInUsePermission?: string | false;
  /**
   * A string to set the `NSLocationAlwaysUsageDescription` permission message.
   * @default "Allow $(PRODUCT_NAME) to use your location"
   * @platform ios
   */
  locationAlwaysPermission?: string | false;
  /**
   * A string to set the `NSLocationWhenInUseUsageDescription` permission message.
   * @default "Allow $(PRODUCT_NAME) to use your location"
   * @platform ios
   */
  locationWhenInUsePermission?: string | false;
  /**
   * Whether to enable location in `UIBackgroundModes`.
   * @default false
   * @platform ios
   */
  isIosBackgroundLocationEnabled?: boolean;
  /**
   * Whether to enable the `ACCESS_BACKGROUND_LOCATION` permission.
   * @default false
   * @platform android
   */
  isAndroidBackgroundLocationEnabled?: boolean;
  /**
   * Whether to enable the `FOREGROUND_SERVICE` and `FOREGROUND_SERVICE_LOCATION` permissions.
   * @default false
   * @platform android
   */
  isAndroidForegroundServiceEnabled?: boolean;
  /**
   * Local path to an image for the foreground service icon. Should be a 96x96 all-white PNG with transparency.
   * @platform android
   */
  androidForegroundServiceIcon?: string;
};

const withLocation: ConfigPlugin<Props | void> = (
  config,
  {
    locationAlwaysAndWhenInUsePermission,
    locationAlwaysPermission,
    locationWhenInUsePermission,
    isIosBackgroundLocationEnabled,
    isAndroidBackgroundLocationEnabled,
    isAndroidForegroundServiceEnabled,
    androidForegroundServiceIcon,
  } = {}
) => {
  if (isIosBackgroundLocationEnabled) {
    config = withBackgroundLocation(config);
  }

  config = withForegroundServiceIcon(config, { icon: androidForegroundServiceIcon ?? null });

  IOSConfig.Permissions.createPermissionsPlugin({
    NSLocationAlwaysAndWhenInUseUsageDescription: LOCATION_USAGE,
    NSLocationAlwaysUsageDescription: LOCATION_USAGE,
    NSLocationWhenInUseUsageDescription: LOCATION_USAGE,
  })(config, {
    NSLocationAlwaysAndWhenInUseUsageDescription: locationAlwaysAndWhenInUsePermission,
    NSLocationAlwaysUsageDescription: locationAlwaysPermission,
    NSLocationWhenInUseUsageDescription: locationWhenInUsePermission,
  });

  // If the user has not specified a value for isAndroidForegroundServiceEnabled,
  // we default to the value of isAndroidBackgroundLocationEnabled because we want
  // to enable foreground by default if background location is enabled.
  const enableAndroidForegroundService =
    typeof isAndroidForegroundServiceEnabled === 'undefined'
      ? isAndroidBackgroundLocationEnabled
      : isAndroidForegroundServiceEnabled;

  return AndroidConfig.Permissions.withPermissions(
    config,
    [
      // Note: these are already added in the library AndroidManifest.xml and so
      // are not required here, we may want to remove them in the future.
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION',
      // These permissions are optional, and not listed in the library AndroidManifest.xml
      isAndroidBackgroundLocationEnabled && 'android.permission.ACCESS_BACKGROUND_LOCATION',
      enableAndroidForegroundService && 'android.permission.FOREGROUND_SERVICE',
      enableAndroidForegroundService && 'android.permission.FOREGROUND_SERVICE_LOCATION',
    ].filter(Boolean) as string[]
  );
};

export default createRunOncePlugin(withLocation, pkg.name, pkg.version);
