import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidColors,
  withDangerousMod,
} from '@expo/config-plugins';
import { ResourceXML } from '@expo/config-plugins/build/android/Resources';
import { ExpoConfig } from '@expo/config-types';
import { compositeImagesAsync, generateImageAsync } from '@expo/image-utils';
import fs from 'fs-extra';
import path from 'path';

import { withAndroidManifestIcons } from './withAndroidManifestIcons';

const { Colors } = AndroidConfig;

type DPIString = 'mdpi' | 'hdpi' | 'xhdpi' | 'xxhdpi' | 'xxxhdpi';
type dpiMap = Record<DPIString, { folderName: string; scale: number }>;

export const dpiValues: dpiMap = {
  mdpi: { folderName: 'mipmap-mdpi', scale: 1 },
  hdpi: { folderName: 'mipmap-hdpi', scale: 1.5 },
  xhdpi: { folderName: 'mipmap-xhdpi', scale: 2 },
  xxhdpi: { folderName: 'mipmap-xxhdpi', scale: 3 },
  xxxhdpi: { folderName: 'mipmap-xxxhdpi', scale: 4 },
};
const BASELINE_PIXEL_SIZE = 48;
export const ANDROID_RES_PATH = 'android/app/src/main/res/';
const MIPMAP_ANYDPI_V26 = 'mipmap-anydpi-v26';
const ICON_BACKGROUND = 'iconBackground';
const IC_LAUNCHER_PNG = 'ic_launcher.png';
const IC_LAUNCHER_ROUND_PNG = 'ic_launcher_round.png';
const IC_LAUNCHER_BACKGROUND_PNG = 'ic_launcher_background.png';
const IC_LAUNCHER_FOREGROUND_PNG = 'ic_launcher_foreground.png';
const IC_LAUNCHER_XML = 'ic_launcher.xml';
const IC_LAUNCHER_ROUND_XML = 'ic_launcher_round.xml';

export const withAndroidIcons: ConfigPlugin = config => {
  const { foregroundImage, backgroundColor, backgroundImage } = getAdaptiveIcon(config);
  const icon = foregroundImage ?? getIcon(config);

  if (!icon) {
    return config;
  }

  config = withAndroidManifestIcons(config);
  // Apply colors.xml changes
  config = withAndroidAdaptiveIconColors(config, backgroundColor);
  return withDangerousMod(config, [
    'android',
    async config => {
      await setIconAsync(config.modRequest.projectRoot, {
        icon,
        backgroundColor,
        backgroundImage,
        isAdaptive: !!config.android?.adaptiveIcon,
      });
      return config;
    },
  ]);
};

export function setRoundIconManifest(
  config: Pick<ExpoConfig, 'android'>,
  manifest: AndroidConfig.Manifest.AndroidManifest
): AndroidConfig.Manifest.AndroidManifest {
  const isAdaptive = !!config.android?.adaptiveIcon;
  const application = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);

  if (isAdaptive) {
    application.$['android:roundIcon'] = '@mipmap/ic_launcher_round';
  } else {
    delete application.$['android:roundIcon'];
  }
  return manifest;
}

const withAndroidAdaptiveIconColors: ConfigPlugin<string | null> = (config, backgroundColor) => {
  return withAndroidColors(config, config => {
    config.modResults = setBackgroundColor(backgroundColor ?? '#FFFFFF', config.modResults);
    return config;
  });
};

export function getIcon(config: ExpoConfig) {
  return config.android?.icon || config.icon || null;
}

export function getAdaptiveIcon(config: ExpoConfig) {
  return {
    foregroundImage: config.android?.adaptiveIcon?.foregroundImage ?? null,
    backgroundColor: config.android?.adaptiveIcon?.backgroundColor ?? null,
    backgroundImage: config.android?.adaptiveIcon?.backgroundImage ?? null,
  };
}

/**
 * Resizes the user-provided icon to create a set of legacy icon files in
 * their respective "mipmap" directories for <= Android 7, and creates a set of adaptive
 * icon files for > Android 7 from the adaptive icon files (if provided).
 */
export async function setIconAsync(
  projectRoot: string,
  {
    icon,
    backgroundColor,
    backgroundImage,
    isAdaptive,
  }: {
    icon: string | null;
    backgroundColor: string | null;
    backgroundImage: string | null;
    isAdaptive: boolean;
  }
) {
  if (!icon) {
    return null;
  }

  await configureLegacyIconAsync(projectRoot, icon, backgroundImage, backgroundColor);
  if (isAdaptive) {
    await generateRoundIconAsync(projectRoot, icon, backgroundImage, backgroundColor);
  } else {
    await deleteIconNamedAsync(projectRoot, IC_LAUNCHER_ROUND_PNG);
  }
  await configureAdaptiveIconAsync(projectRoot, icon, backgroundImage, isAdaptive);

  return true;
}

/**
 * Configures legacy icon files to be used on Android 7 and earlier. If adaptive icon configuration
 * was provided, we create a pseudo-adaptive icon by layering the provided files (or background
 * color if no backgroundImage is provided. If no backgroundImage and no backgroundColor are provided,
 * the background is set to transparent.)
 */
async function configureLegacyIconAsync(
  projectRoot: string,
  icon: string,
  backgroundImage: string | null,
  backgroundColor: string | null
) {
  return generateMultiLayerImageAsync(projectRoot, {
    icon,
    backgroundImage,
    backgroundColor,
    outputImageFileName: IC_LAUNCHER_PNG,
    imageCacheFolder: 'android-standard-square',
    backgroundImageCacheFolder: 'android-standard-square-background',
  });
}

async function generateRoundIconAsync(
  projectRoot: string,
  icon: string,
  backgroundImage: string | null,
  backgroundColor: string | null
) {
  return generateMultiLayerImageAsync(projectRoot, {
    icon,
    borderRadiusRatio: 0.5,
    outputImageFileName: IC_LAUNCHER_ROUND_PNG,
    backgroundImage,
    backgroundColor,
    imageCacheFolder: 'android-standard-circle',
    backgroundImageCacheFolder: 'android-standard-round-background',
  });
}

/**
 * Configures adaptive icon files to be used on Android 8 and up. A foreground image must be provided,
 * and will have a transparent background unless:
 * - A backgroundImage is provided, or
 * - A backgroundColor was specified
 */
export async function configureAdaptiveIconAsync(
  projectRoot: string,
  foregroundImage: string,
  backgroundImage: string | null,
  isAdaptive: boolean
) {
  await generateMultiLayerImageAsync(projectRoot, {
    backgroundColor: 'transparent',
    backgroundImage,
    backgroundImageCacheFolder: 'android-adaptive-background',
    outputImageFileName: IC_LAUNCHER_FOREGROUND_PNG,
    icon: foregroundImage,
    imageCacheFolder: 'android-adaptive-foreground',
    backgroundImageFileName: IC_LAUNCHER_BACKGROUND_PNG,
  });

  // create ic_launcher.xml and ic_launcher_round.xml
  const icLauncherXmlString = createAdaptiveIconXmlString(backgroundImage);
  await createAdaptiveIconXmlFiles(
    projectRoot,
    icLauncherXmlString,
    // If the user only defined icon and not android.adaptiveIcon, then skip enabling the layering system
    // this will scale the image down and present it uncropped.
    isAdaptive
  );
}

function setBackgroundColor(backgroundColor: string | null, colors: ResourceXML) {
  return Colors.assignColorValue(colors, {
    value: backgroundColor,
    name: ICON_BACKGROUND,
  });
}

export const createAdaptiveIconXmlString = (backgroundImage: string | null) => {
  const background = backgroundImage ? `@mipmap/ic_launcher_background` : `@color/iconBackground`;

  return `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="${background}"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;
};

async function createAdaptiveIconXmlFiles(
  projectRoot: string,
  icLauncherXmlString: string,
  add: boolean
) {
  const anyDpiV26Directory = path.resolve(projectRoot, ANDROID_RES_PATH, MIPMAP_ANYDPI_V26);
  await fs.ensureDir(anyDpiV26Directory);
  const launcherPath = path.resolve(anyDpiV26Directory, IC_LAUNCHER_XML);
  const launcherRoundPath = path.resolve(anyDpiV26Directory, IC_LAUNCHER_ROUND_XML);
  if (add) {
    await Promise.all([
      fs.writeFile(launcherPath, icLauncherXmlString),
      fs.writeFile(launcherRoundPath, icLauncherXmlString),
    ]);
  } else {
    // Remove the xml if the icon switches from adaptive to standard.
    await Promise.all(
      [launcherPath, launcherRoundPath].map(async path => {
        if (fs.existsSync(path)) {
          return fs.remove(path);
        }
      })
    );
  }
}

async function generateMultiLayerImageAsync(
  projectRoot: string,
  {
    icon,
    backgroundColor,
    backgroundImage,
    imageCacheFolder,
    backgroundImageCacheFolder,
    borderRadiusRatio,
    outputImageFileName,
    backgroundImageFileName,
  }: {
    icon: string;
    backgroundImage: string | null;
    backgroundColor: string | null;
    imageCacheFolder: string;
    backgroundImageCacheFolder: string;
    backgroundImageFileName?: string;
    borderRadiusRatio?: number;
    outputImageFileName: string;
  }
) {
  await iterateDpiValues(projectRoot, async ({ dpiFolder, scale }) => {
    let iconLayer = await generateIconAsync(projectRoot, {
      cacheType: imageCacheFolder,
      src: icon,
      scale,
      // backgroundImage overrides backgroundColor
      backgroundColor: backgroundImage ? 'transparent' : backgroundColor ?? 'transparent',
      borderRadiusRatio,
    });

    if (backgroundImage) {
      const backgroundLayer = await generateIconAsync(projectRoot, {
        cacheType: backgroundImageCacheFolder,
        src: backgroundImage,
        scale,
        backgroundColor: 'transparent',
        borderRadiusRatio,
      });

      if (backgroundImageFileName) {
        await fs.writeFile(path.resolve(dpiFolder, backgroundImageFileName), backgroundLayer);
      } else {
        iconLayer = await compositeImagesAsync({
          foreground: iconLayer,
          background: backgroundLayer,
        });
      }
    } else if (backgroundImageFileName) {
      // Remove any instances of ic_launcher_background.png that are there from previous icons
      await deleteIconNamedAsync(projectRoot, backgroundImageFileName);
    }

    await fs.ensureDir(dpiFolder);
    await fs.writeFile(path.resolve(dpiFolder, outputImageFileName), iconLayer);
  });
}

function iterateDpiValues(
  projectRoot: string,
  callback: (value: { dpiFolder: string; folderName: string; scale: number }) => Promise<void>
) {
  return Promise.all(
    Object.values(dpiValues).map(value =>
      callback({
        dpiFolder: path.resolve(projectRoot, ANDROID_RES_PATH, value.folderName),
        ...value,
      })
    )
  );
}

async function deleteIconNamedAsync(projectRoot: string, name: string) {
  return iterateDpiValues(projectRoot, ({ dpiFolder }) => {
    return fs.remove(path.resolve(dpiFolder, name));
  });
}

async function generateIconAsync(
  projectRoot: string,
  {
    cacheType,
    src,
    scale,
    backgroundColor,
    borderRadiusRatio,
  }: {
    cacheType: string;
    src: string;
    scale: number;
    backgroundColor: string;
    borderRadiusRatio?: number;
  }
) {
  const iconSizePx = BASELINE_PIXEL_SIZE * scale;

  return (
    await generateImageAsync(
      { projectRoot, cacheType },
      {
        src,
        width: iconSizePx,
        height: iconSizePx,
        resizeMode: 'cover',
        backgroundColor,
        borderRadius: borderRadiusRatio ? iconSizePx * borderRadiusRatio : undefined,
      }
    )
  ).source;
}
