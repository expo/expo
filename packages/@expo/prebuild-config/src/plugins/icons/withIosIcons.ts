import { ConfigPlugin, IOSConfig, WarningAggregator, withDangerousMod } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
import { createSquareAsync, generateImageAsync } from '@expo/image-utils';
import * as fs from 'fs-extra';
import { join } from 'path';

import { ContentsJson, writeContentsJsonAsync } from './AssetContents';

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

export function getIcons(config: Pick<ExpoConfig, 'icon' | 'ios'>): string | null {
  // No support for empty strings.
  return config.ios?.icon || config.icon || null;
}

export async function setIconsAsync(config: ExpoConfig, projectRoot: string) {
  const icon = getIcons(config);
  if (!icon) {
    WarningAggregator.addWarningIOS('icon', 'No icon is defined in the Expo config.');
  }
  // Something like projectRoot/ios/MyApp/
  const iosNamedProjectRoot = getIosNamedProjectPath(projectRoot);

  // Ensure the Images.xcassets/AppIcon.appiconset path exists
  await fs.ensureDir(join(iosNamedProjectRoot, IMAGESET_PATH));

  // Store the image JSON data for assigning via the Contents.json
  const imagesJson: ContentsJson['images'] = await generateUniversalIconAsync(projectRoot, {
    icon,
    cacheKey: 'universal-icon',
    iosNamedProjectRoot,
    platform: 'ios',
  });

  // Finally, write the Config.json
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

function getAppleIconName(size: number, scale: number): string {
  return `App-Icon-${size}x${size}@${scale}x.png`;
}

export async function generateUniversalIconAsync(
  projectRoot: string,
  {
    icon,
    cacheKey,
    iosNamedProjectRoot,
    platform,
  }: {
    platform: 'watchos' | 'ios';
    icon?: string | null;
    iosNamedProjectRoot: string;
    cacheKey: string;
  }
): Promise<ContentsJson['images']> {
  const size = 1024;
  const filename = getAppleIconName(size, 1);

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
          removeTransparency: true,
          // The icon should be square, but if it's not then it will be cropped.
          resizeMode: 'cover',
          // Force the background color to solid white to prevent any transparency.
          // TODO: Maybe use a more adaptive option based on the icon color?
          backgroundColor: '#ffffff',
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

  return [
    {
      filename: getAppleIconName(size, 1),
      idiom: 'universal',
      platform,
      size: `${size}x${size}`,
    },
  ];
}
