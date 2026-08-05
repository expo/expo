import { generateImageAsync, ImageOptions } from '@expo/image-utils';
import { ConfigPlugin, IOSConfig, withDangerousMod } from 'expo/config-plugins';
import fs from 'fs';
import path from 'path';

import { IOSSplashConfig } from './types';

const IMAGE_CACHE_NAME = 'splash-ios';
const IMAGESET_PATH = 'Images.xcassets/SplashScreenLogo.imageset';
const LEGACY_IMAGESET_PATH = 'Images.xcassets/SplashScreenLegacy.imageset';
const PNG_FILENAME = 'image';
const DARK_PNG_FILENAME = 'dark_image';
const TABLET_PNG_FILENAME = 'tablet_image';
const DARK_TABLET_PNG_FILENAME = 'dark_tablet_image';

const darkAppearances = [{ appearance: 'luminosity', value: 'dark' }] as const;

interface ContentsJsonImage {
  appearances?: typeof darkAppearances;
  filename?: string;
  idiom: 'universal' | 'ipad';
  scale?: '1x' | '2x' | '3x';
}

export const withIosSplashAssets: ConfigPlugin<IOSSplashConfig> = (config, splash) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const iosNamedProjectRoot = IOSConfig.Paths.getSourceRoot(config.modRequest.projectRoot);

      await configureImageAssets({
        projectRoot: config.modRequest.projectRoot,
        iosNamedProjectRoot,
        image: splash.image,
        darkImage: splash.dark?.image,
        tabletImage: splash.tabletImage,
        darkTabletImage: splash.dark?.tabletImage,
        imageWidth: splash.imageWidth,
        enableFullScreenImage: splash.enableFullScreenImage_legacy,
      });

      return config;
    },
  ]);
};

/**
 * Creates imageset containing image for Splash/Launch Screen.
 */
async function configureImageAssets({
  projectRoot,
  iosNamedProjectRoot,
  image,
  darkImage,
  tabletImage,
  darkTabletImage,
  imageWidth,
  enableFullScreenImage,
}: {
  projectRoot: string;
  iosNamedProjectRoot: string;
  image: string | undefined;
  darkImage: string | undefined;
  tabletImage: string | undefined;
  darkTabletImage: string | undefined;
  imageWidth: number;
  enableFullScreenImage: boolean;
}) {
  const imagePath = enableFullScreenImage ? LEGACY_IMAGESET_PATH : IMAGESET_PATH;
  const imageSetPath = path.resolve(iosNamedProjectRoot, imagePath);

  // remove legacy imageSet if it is not used
  if (!enableFullScreenImage) {
    const legacyImageSetPath = path.resolve(iosNamedProjectRoot, LEGACY_IMAGESET_PATH);
    await fs.promises.rm(legacyImageSetPath, { force: true, recursive: true });
  }

  // ensure old SplashScreen imageSet is removed
  await fs.promises.rm(imageSetPath, { force: true, recursive: true });

  if (!image) {
    return;
  }

  await writeContentsJsonAsync({
    assetPath: imageSetPath,
    image: PNG_FILENAME,
    darkImage: darkImage ? DARK_PNG_FILENAME : undefined,
    tabletImage: tabletImage ? TABLET_PNG_FILENAME : undefined,
    darkTabletImage: darkTabletImage ? DARK_TABLET_PNG_FILENAME : undefined,
  });

  await copyImageFiles({
    projectRoot,
    iosNamedProjectRoot,
    image,
    darkImage,
    tabletImage,
    darkTabletImage,
    imageWidth,
    enableFullScreenImage,
  });
}

async function copyImageFiles({
  projectRoot,
  iosNamedProjectRoot,
  image,
  darkImage,
  tabletImage,
  darkTabletImage,
  imageWidth,
  enableFullScreenImage,
}: {
  projectRoot: string;
  iosNamedProjectRoot: string;
  image: string;
  darkImage: string | undefined;
  tabletImage: string | undefined;
  darkTabletImage: string | undefined;
  imageWidth: number;
  enableFullScreenImage: boolean;
}) {
  await generateImagesAssetsAsync({
    async generateImageAsset(item, fileName) {
      await Promise.all(
        [
          { ratio: 1, suffix: '' },
          { ratio: 2, suffix: '@2x' },
          { ratio: 3, suffix: '@3x' },
        ].map(async ({ ratio, suffix }) => {
          const size = imageWidth * ratio;
          // Using this method will cache the images in `.expo` based on the properties used to generate them.
          // this method also supports remote URLs and using the global sharp instance.
          const { source } = await generateImageAsync(
            { projectRoot, cacheType: IMAGE_CACHE_NAME },
            {
              src: item,
              width: enableFullScreenImage ? undefined : size,
              height: enableFullScreenImage ? undefined : size,
            } as ImageOptions
          );
          // Write image buffer to the file system.
          // const assetPath = join(iosNamedProjectRoot, IMAGESET_PATH, filename);
          await fs.promises.writeFile(
            path.resolve(
              iosNamedProjectRoot,
              enableFullScreenImage ? LEGACY_IMAGESET_PATH : IMAGESET_PATH,
              `${fileName}${suffix}.png`
            ),
            source
          );
        })
      );
    },
    anyItem: image,
    darkItem: darkImage,
    tabletItem: tabletImage,
    darkTabletItem: darkTabletImage,
  });
}

async function generateImagesAssetsAsync({
  generateImageAsset,
  anyItem,
  darkItem,
  tabletItem,
  darkTabletItem,
}: {
  generateImageAsset: (item: string, fileName: string) => Promise<void>;
  anyItem: string;
  darkItem: string | undefined;
  tabletItem: string | undefined;
  darkTabletItem: string | undefined;
}) {
  const items = [
    [anyItem, PNG_FILENAME],
    [darkItem, DARK_PNG_FILENAME],
    [tabletItem, TABLET_PNG_FILENAME],
    [darkTabletItem, DARK_TABLET_PNG_FILENAME],
  ].filter((tuple): tuple is [string, string] => tuple[0] != null);

  await Promise.all(items.map(([item, fileName]) => generateImageAsset(item, fileName)));
}

export function buildContentsJsonImages({
  image,
  darkImage,
  tabletImage,
  darkTabletImage,
}: {
  image: string;
  tabletImage: string | undefined;
  darkImage: string | undefined;
  darkTabletImage: string | undefined;
}): ContentsJsonImage[] {
  // Phone light
  const images: ContentsJsonImage[] = [
    {
      idiom: 'universal',
      filename: `${image}.png`,
      scale: '1x',
    },
    {
      idiom: 'universal',
      filename: `${image}@2x.png`,
      scale: '2x',
    },
    {
      idiom: 'universal',
      filename: `${image}@3x.png`,
      scale: '3x',
    },
  ];

  // Phone dark
  if (darkImage) {
    images.push(
      {
        idiom: 'universal',
        appearances: darkAppearances,
        scale: '1x',
        filename: `${darkImage}.png`,
      },
      {
        idiom: 'universal',
        appearances: darkAppearances,
        scale: '2x',
        filename: `${darkImage}@2x.png`,
      },
      {
        idiom: 'universal',
        appearances: darkAppearances,
        scale: '3x',
        filename: `${darkImage}@3x.png`,
      }
    );
  }

  // Tablet light
  if (tabletImage) {
    images.push(
      {
        idiom: 'ipad',
        filename: `${tabletImage}.png`,
        scale: '1x',
      },
      {
        idiom: 'ipad',
        scale: '2x',
        filename: `${tabletImage}@2x.png`,
      }
    );
  }

  // Tablet dark
  if (darkTabletImage) {
    images.push(
      {
        idiom: 'ipad',
        appearances: darkAppearances,
        filename: `${darkTabletImage}.png`,
        scale: '1x',
      },
      {
        idiom: 'ipad',
        appearances: darkAppearances,
        filename: `${darkTabletImage}@2x.png`,
        scale: '2x',
      }
    );
  }

  return images;
}

async function writeContentsJsonAsync({
  assetPath,
  image,
  darkImage,
  tabletImage,
  darkTabletImage,
}: {
  assetPath: string;
  image: string;
  darkImage: string | undefined;
  tabletImage: string | undefined;
  darkTabletImage: string | undefined;
}) {
  const images = buildContentsJsonImages({ image, darkImage, tabletImage, darkTabletImage });

  await fs.promises.mkdir(assetPath, { recursive: true });
  await fs.promises.writeFile(
    path.join(assetPath, 'Contents.json'),
    JSON.stringify(
      {
        images,
        info: {
          version: 1,
          // common practice is for the tool that generated the icons to be the "author"
          author: 'expo',
        },
      },
      null,
      2
    ),
    'utf8'
  );
}
