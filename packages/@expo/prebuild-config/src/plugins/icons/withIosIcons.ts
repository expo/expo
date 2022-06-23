import { ConfigPlugin, IOSConfig, WarningAggregator, withDangerousMod } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
import { generateImageAsync } from '@expo/image-utils';
import * as fs from 'fs-extra';
import { join } from 'path';

import { ContentsJson, ContentsJsonImageIdiom, writeContentsJsonAsync } from './AssetContents';

const { getProjectName } = IOSConfig.XcodeUtils;

export const withIosIcons: ConfigPlugin = config => {
  return withDangerousMod(config, [
    'ios',
    async config => {
      await setIconsAsync(config, config.modRequest.projectRoot);
      return config;
    },
  ]);
};

const IMAGE_CACHE_NAME = 'icons';
const IMAGESET_PATH = 'Images.xcassets/AppIcon.appiconset';

// Hard-coding seemed like the clearest and safest way to implement the sizes.
export const ICON_CONTENTS: {
  idiom: ContentsJsonImageIdiom;
  sizes: { size: number; scales: (1 | 2 | 3)[] }[];
}[] = [
  {
    idiom: 'iphone',
    sizes: [
      {
        size: 20,
        scales: [2, 3],
      },
      {
        size: 29,
        scales: [1, 2, 3],
      },
      {
        size: 40,
        scales: [2, 3],
      },
      {
        size: 60,
        scales: [2, 3],
      },
      // TODO: 76x76@2x seems unused now
      // {
      //   size: 76,
      //   scales: [2],
      // },
    ],
  },
  {
    idiom: 'ipad',
    sizes: [
      {
        size: 20,
        scales: [1, 2],
      },
      {
        size: 29,
        scales: [1, 2],
      },
      {
        size: 40,
        scales: [1, 2],
      },
      {
        size: 76,
        scales: [1, 2],
      },
      {
        size: 83.5,
        scales: [2],
      },
    ],
  },
  {
    idiom: 'ios-marketing',
    sizes: [
      {
        size: 1024,
        scales: [1],
      },
    ],
  },
];

export function getIcons(config: Pick<ExpoConfig, 'icon' | 'ios'>): string | null {
  // No support for empty strings.
  return config.ios?.icon || config.icon || null;
}

export async function setIconsAsync(config: ExpoConfig, projectRoot: string) {
  const icon = getIcons(config);
  if (!icon) {
    WarningAggregator.addWarningIOS(
      'icon',
      'This is the image that your app uses on your home screen, you will need to configure it manually.'
    );
    return;
  }

  // Something like projectRoot/ios/MyApp/
  const iosNamedProjectRoot = getIosNamedProjectPath(projectRoot);

  // Ensure the Images.xcassets/AppIcon.appiconset path exists
  await fs.ensureDir(join(iosNamedProjectRoot, IMAGESET_PATH));

  // Store the image JSON data for assigning via the Contents.json
  const imagesJson: ContentsJson['images'] = [];

  // keep track of icons that have been generated so we can reuse them in the Contents.json
  const generatedIcons: Record<string, boolean> = {};

  for (const platform of ICON_CONTENTS) {
    const isMarketing = platform.idiom === 'ios-marketing';
    for (const { size, scales } of platform.sizes) {
      for (const scale of scales) {
        // The marketing icon is special because it makes no sense.
        const filename = isMarketing ? 'ItunesArtwork@2x.png' : getAppleIconName(size, scale);
        // Only create an image that hasn't already been generated.
        if (!(filename in generatedIcons)) {
          const iconSizePx = size * scale;

          // Using this method will cache the images in `.expo` based on the properties used to generate them.
          // this method also supports remote URLs and using the global sharp instance.
          const { source } = await generateImageAsync(
            { projectRoot, cacheType: IMAGE_CACHE_NAME },
            {
              src: icon,
              name: filename,
              width: iconSizePx,
              height: iconSizePx,
              removeTransparency: true,
              // The icon should be square, but if it's not then it will be cropped.
              resizeMode: 'cover',
              // Force the background color to solid white to prevent any transparency.
              // TODO: Maybe use a more adaptive option based on the icon color?
              backgroundColor: '#ffffff',
            }
          );
          // Write image buffer to the file system.
          const assetPath = join(iosNamedProjectRoot, IMAGESET_PATH, filename);
          await fs.writeFile(assetPath, source);
          // Save a reference to the generated image so we don't create a duplicate.
          generatedIcons[filename] = true;
        }
        imagesJson.push({
          idiom: platform.idiom,
          size: `${size}x${size}`,
          // @ts-ignore: template types not supported in TS yet
          scale: `${scale}x`,
          filename,
        });
      }
    }
  }

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
