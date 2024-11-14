import { ConfigPlugin, IOSConfig, WarningAggregator, withDangerousMod } from '@expo/config-plugins';
import { ExpoConfig, IOSIcons } from '@expo/config-types';
import { createSquareAsync, generateImageAsync } from '@expo/image-utils';
import * as fs from 'fs-extra';
import { join } from 'path';

import { ContentsJson, ContentsJsonImage, writeContentsJsonAsync } from './AssetContents';

const { getProjectName } = IOSConfig.XcodeUtils;

const IMAGE_CACHE_NAME = 'icons';
const IMAGESET_PATH = 'Images.xcassets/AppIcon.appiconset';

export const withIosIcons: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      await setIconsAsync(config, config.modRequest.projectRoot);
      return config;
    },
  ]);
};

export function getIcons(config: Pick<ExpoConfig, 'icon' | 'ios'>): IOSIcons | string | null {
  const iosSpecificIcons = config.ios?.icon;

  if (iosSpecificIcons) {
    // For backwards compatibility, the icon can be a string
    if (typeof iosSpecificIcons === 'string') {
      return iosSpecificIcons || config.icon || null;
    }

    // in iOS 18 introduced the ability to specify dark and tinted icons, which users can specify as an object
    if (!iosSpecificIcons.light && !iosSpecificIcons.dark && !iosSpecificIcons.tinted) {
      return config.icon || null;
    }

    return iosSpecificIcons;
  }

  if (config.icon) {
    return config.icon;
  }

  return null;
}

export async function setIconsAsync(config: ExpoConfig, projectRoot: string) {
  const icon = getIcons(config);

  if (
    !icon ||
    (typeof icon === 'string' && !icon) ||
    (typeof icon === 'object' && !icon?.light && !icon?.dark && !icon?.tinted)
  ) {
    WarningAggregator.addWarningIOS('icon', 'No icon is defined in the Expo config.');
  }

  // Something like projectRoot/ios/MyApp/
  const iosNamedProjectRoot = getIosNamedProjectPath(projectRoot);

  // Ensure the Images.xcassets/AppIcon.appiconset path exists
  await fs.ensureDir(join(iosNamedProjectRoot, IMAGESET_PATH));

  const imagesJson: ContentsJson['images'] = [];

  const baseIconPath = typeof icon === 'object' ? icon?.light || icon?.dark || icon?.tinted : icon;

  // Store the image JSON data for assigning via the Contents.json
  const baseIcon = await generateUniversalIconAsync(projectRoot, {
    icon: baseIconPath,
    cacheKey: 'universal-icon',
    iosNamedProjectRoot,
    platform: 'ios',
  });

  imagesJson.push(baseIcon);

  if (typeof icon === 'object') {
    if (icon?.dark) {
      const darkIcon = await generateUniversalIconAsync(projectRoot, {
        icon: icon.dark,
        cacheKey: 'universal-icon-dark',
        iosNamedProjectRoot,
        platform: 'ios',
        appearance: 'dark',
      });

      imagesJson.push(darkIcon);
    }

    if (icon?.tinted) {
      const tintedIcon = await generateUniversalIconAsync(projectRoot, {
        icon: icon.tinted,
        cacheKey: 'universal-icon-tinted',
        iosNamedProjectRoot,
        platform: 'ios',
        appearance: 'tinted',
      });

      imagesJson.push(tintedIcon);
    }
  }

  // Finally, write the Contents.json
  await writeContentsJsonAsync(join(iosNamedProjectRoot, IMAGESET_PATH), { images: imagesJson });
}

/**
 * Return the project's named iOS path: ios/MyProject/
 *
 * @param projectRoot Expo project root path.
 */
function getIosNamedProjectPath(projectRoot: string): string {
  const projectName = getProjectName(projectRoot);
  return join(projectRoot, 'ios', projectName);
}

function getAppleIconName(size: number, scale: number, appearance?: 'dark' | 'tinted'): string {
  let name = 'App-Icon';

  if (appearance) {
    name = `${name}-${appearance}`;
  }

  name = `${name}-${size}x${size}@${scale}x.png`;

  return name;
}

export async function generateUniversalIconAsync(
  projectRoot: string,
  {
    icon,
    cacheKey,
    iosNamedProjectRoot,
    platform,
    appearance,
  }: {
    platform: 'watchos' | 'ios';
    icon?: string | null;
    appearance?: 'dark' | 'tinted';
    iosNamedProjectRoot: string;
    cacheKey: string;
  }
): Promise<ContentsJsonImage> {
  const size = 1024;
  const filename = getAppleIconName(size, 1, appearance);

  let source: Buffer;

  if (icon) {
    // Using this method will cache the images in `.expo` based on the properties used to generate them.
    // this method also supports remote URLs and using the global sharp instance.
    source = (
      await generateImageAsync(
        { projectRoot, cacheType: IMAGE_CACHE_NAME + cacheKey },
        {
          src: icon,
          name: filename,
          width: size,
          height: size,
          // Transparency needs to be preserved in dark variant, but can safely be removed in "light" and "tinted" variants.
          removeTransparency: appearance !== 'dark',
          // The icon should be square, but if it's not then it will be cropped.
          resizeMode: 'cover',
          // Force the background color to solid white to prevent any transparency. (for "any" and "tinted" variants)
          // TODO: Maybe use a more adaptive option based on the icon color?
          backgroundColor: appearance !== 'dark' ? '#ffffff' : undefined,
        }
      )
    ).source;
  } else {
    // Create a white square image if no icon exists to mitigate the chance of a submission failure to the app store.
    source = await createSquareAsync({ size });
  }
  // Write image buffer to the file system.
  const assetPath = join(iosNamedProjectRoot, IMAGESET_PATH, filename);
  await fs.writeFile(assetPath, source);

  return {
    filename,
    idiom: 'universal',
    platform,
    size: `${size}x${size}`,
    ...(appearance ? { appearances: [{ appearance: 'luminosity', value: appearance }] } : {}),
  };
}
