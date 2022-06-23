import { ConfigPlugin, IOSConfig, withDangerousMod } from '@expo/config-plugins';
import { generateImageAsync } from '@expo/image-utils';
import Debug from 'debug';
import fs from 'fs-extra';
// @ts-ignore
import Jimp from 'jimp-compact';
import * as path from 'path';

import {
  ContentsJsonImage,
  ContentsJsonImageAppearance,
  createContentsJsonItem,
  writeContentsJsonAsync,
} from '../../icons/AssetContents';
import { IOSSplashConfig } from './getIosSplashConfig';

const debug = Debug('expo:prebuild-config:expo-splash-screen:ios:assets');

const IMAGE_CACHE_NAME = 'splash-ios';
const IMAGESET_PATH = 'Images.xcassets/SplashScreen.imageset';
const BACKGROUND_IMAGESET_PATH = 'Images.xcassets/SplashScreenBackground.imageset';
const PNG_FILENAME = 'image.png';
const DARK_PNG_FILENAME = 'dark_image.png';
const TABLET_PNG_FILENAME = 'tablet_image.png';
const DARK_TABLET_PNG_FILENAME = 'dark_tablet_image.png';

export const withIosSplashAssets: ConfigPlugin<IOSSplashConfig> = (config, splash) => {
  if (!splash) {
    return config;
  }
  return withDangerousMod(config, [
    'ios',
    async config => {
      const iosNamedProjectRoot = IOSConfig.Paths.getSourceRoot(config.modRequest.projectRoot);

      await createSplashScreenBackgroundImageAsync({
        iosNamedProjectRoot,
        splash,
      });

      await configureImageAssets({
        projectRoot: config.modRequest.projectRoot,
        iosNamedProjectRoot,
        image: splash.image,
        darkImage: splash.dark?.image,
        tabletImage: splash.tabletImage,
        darkTabletImage: splash.dark?.tabletImage,
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
}: {
  projectRoot: string;
  iosNamedProjectRoot: string;
  image?: string | null;
  darkImage?: string | null;
  tabletImage: string | null;
  darkTabletImage?: string | null;
}) {
  const imageSetPath = path.resolve(iosNamedProjectRoot, IMAGESET_PATH);

  // ensure old SplashScreen imageSet is removed
  await fs.remove(imageSetPath);

  if (!image) {
    return;
  }

  await writeContentsJsonFileAsync({
    assetPath: imageSetPath,
    image: PNG_FILENAME,
    darkImage: darkImage ? DARK_PNG_FILENAME : null,
    tabletImage: tabletImage ? TABLET_PNG_FILENAME : null,
    darkTabletImage: darkTabletImage ? DARK_TABLET_PNG_FILENAME : null,
  });

  await copyImageFiles({
    projectRoot,
    iosNamedProjectRoot,
    image,
    darkImage,
    tabletImage,
    darkTabletImage,
  });
}

async function createPngFileAsync(color: string, filePath: string) {
  const png = new Jimp(1, 1, color);
  return png.writeAsync(filePath);
}

async function createBackgroundImagesAsync({
  iosNamedProjectRoot,
  color,
  darkColor,
  tabletColor,
  darkTabletColor,
}: {
  iosNamedProjectRoot: string;
  color: string;
  darkColor: string | null;
  tabletColor: string | null;
  darkTabletColor: string | null;
}) {
  await generateImagesAssetsAsync({
    async generateImageAsset(item, fileName) {
      await createPngFileAsync(
        item,
        path.resolve(iosNamedProjectRoot, BACKGROUND_IMAGESET_PATH, fileName)
      );
    },
    anyItem: color,
    darkItem: darkColor,
    tabletItem: tabletColor,
    darkTabletItem: darkTabletColor,
  });
}

async function copyImageFiles({
  projectRoot,
  iosNamedProjectRoot,
  image,
  darkImage,
  tabletImage,
  darkTabletImage,
}: {
  projectRoot: string;
  iosNamedProjectRoot: string;
  image: string;
  darkImage?: string | null;
  tabletImage?: string | null;
  darkTabletImage?: string | null;
}) {
  await generateImagesAssetsAsync({
    async generateImageAsset(item, fileName) {
      // Using this method will cache the images in `.expo` based on the properties used to generate them.
      // this method also supports remote URLs and using the global sharp instance.
      const { source } = await generateImageAsync({ projectRoot, cacheType: IMAGE_CACHE_NAME }, {
        src: item,
      } as any);
      // Write image buffer to the file system.
      // const assetPath = join(iosNamedProjectRoot, IMAGESET_PATH, filename);
      await fs.writeFile(path.resolve(iosNamedProjectRoot, IMAGESET_PATH, fileName), source);
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
  darkItem?: string | null;
  tabletItem?: string | null;
  darkTabletItem?: string | null;
}) {
  const items = ([
    [anyItem, PNG_FILENAME],
    [darkItem, DARK_PNG_FILENAME],
    [tabletItem, TABLET_PNG_FILENAME],
    [darkTabletItem, DARK_TABLET_PNG_FILENAME],
  ].filter(([item]) => !!item) as unknown) as [string, string];

  await Promise.all(items.map(([item, fileName]) => generateImageAsset(item, fileName)));
}

async function createSplashScreenBackgroundImageAsync({
  iosNamedProjectRoot,
  splash,
}: {
  // Something like projectRoot/ios/MyApp/
  iosNamedProjectRoot: string;
  splash: IOSSplashConfig;
}) {
  const color = splash.backgroundColor;
  const darkColor = splash.dark?.backgroundColor;
  const tabletColor = splash.tabletBackgroundColor;
  const darkTabletColor = splash.dark?.tabletBackgroundColor;

  const imagesetPath = path.join(iosNamedProjectRoot, BACKGROUND_IMAGESET_PATH);
  // Ensure the Images.xcassets/... path exists
  await fs.remove(imagesetPath);
  await fs.ensureDir(imagesetPath);

  await createBackgroundImagesAsync({
    iosNamedProjectRoot,
    color,
    darkColor: darkColor ? darkColor : null,
    tabletColor: tabletColor ? tabletColor : null,
    darkTabletColor: darkTabletColor ? darkTabletColor : null,
  });

  await writeContentsJsonFileAsync({
    assetPath: path.resolve(iosNamedProjectRoot, BACKGROUND_IMAGESET_PATH),
    image: PNG_FILENAME,
    darkImage: darkColor ? DARK_PNG_FILENAME : null,
    tabletImage: tabletColor ? TABLET_PNG_FILENAME : null,
    darkTabletImage: darkTabletColor ? DARK_TABLET_PNG_FILENAME : null,
  });
}

const darkAppearances: ContentsJsonImageAppearance[] = [
  {
    appearance: 'luminosity',
    value: 'dark',
  } as ContentsJsonImageAppearance,
];

export function buildContentsJsonImages({
  image,
  darkImage,
  tabletImage,
  darkTabletImage,
}: {
  image: string;
  tabletImage: string | null;
  darkImage: string | null;
  darkTabletImage: string | null;
}): ContentsJsonImage[] {
  return [
    // Phone light
    createContentsJsonItem({
      idiom: 'universal',
      filename: image,
      scale: '1x',
    }),
    createContentsJsonItem({
      idiom: 'universal',
      scale: '2x',
    }),
    createContentsJsonItem({
      idiom: 'universal',
      scale: '3x',
    }),
    // Phone dark
    darkImage &&
      createContentsJsonItem({
        idiom: 'universal',
        appearances: darkAppearances,
        filename: darkImage,
        scale: '1x',
      }),
    darkImage &&
      createContentsJsonItem({
        idiom: 'universal',
        appearances: darkAppearances,
        scale: '2x',
      }),
    darkImage &&
      createContentsJsonItem({
        idiom: 'universal',
        appearances: darkAppearances,
        scale: '3x',
      }),
    // Tablet light
    tabletImage &&
      createContentsJsonItem({
        idiom: 'ipad',
        filename: tabletImage,
        scale: '1x',
      }),
    tabletImage &&
      createContentsJsonItem({
        idiom: 'ipad',
        scale: '2x',
      }),
    // Phone dark
    darkTabletImage &&
      createContentsJsonItem({
        idiom: 'ipad',
        appearances: darkAppearances,
        filename: darkTabletImage ?? undefined,
        scale: '1x',
      }),
    darkTabletImage &&
      createContentsJsonItem({
        idiom: 'ipad',
        appearances: darkAppearances,
        scale: '2x',
      }),
  ].filter(Boolean) as ContentsJsonImage[];
}

async function writeContentsJsonFileAsync({
  assetPath,
  image,
  darkImage,
  tabletImage,
  darkTabletImage,
}: {
  assetPath: string;
  image: string;
  darkImage: string | null;
  tabletImage: string | null;
  darkTabletImage: string | null;
}) {
  const images = buildContentsJsonImages({ image, darkImage, tabletImage, darkTabletImage });

  debug(`create contents.json:`, assetPath);
  debug(`use images:`, images);
  await writeContentsJsonAsync(assetPath, { images });
}
