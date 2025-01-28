import { ConfigPlugin, IOSConfig, withDangerousMod } from '@expo/config-plugins';
import Debug from 'debug';
import fs from 'fs-extra';
// @ts-ignore
import path, { join } from 'path';

import { parseColor } from './InterfaceBuilder';
import { IOSSplashConfig } from './getIosSplashConfig';
import { ContentsJsonColor } from '../../icons/AssetContents';

const debug = Debug('expo:prebuild-config:expo-splash-screen:ios:splash-colorset');

export const SPLASHSCREEN_COLORSET_PATH = 'Images.xcassets/SplashScreenBackground.colorset';

export const withIosSplashColors: ConfigPlugin<IOSSplashConfig> = (config, splash) => {
  if (!splash) {
    return config;
  }
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const iosNamedProjectRoot = IOSConfig.Paths.getSourceRoot(config.modRequest.projectRoot);

      await configureColorAssets({
        iosNamedProjectRoot,
        backgroundColor: splash.backgroundColor,
        darkBackgroundColor: splash.dark?.backgroundColor,
      });
      return config;
    },
  ]);
};

async function configureColorAssets({
  iosNamedProjectRoot,
  backgroundColor = '#ffffff',
  darkBackgroundColor,
}: {
  iosNamedProjectRoot: string;
  backgroundColor: string;
  darkBackgroundColor?: string | null;
}) {
  const colorsetPath = path.resolve(iosNamedProjectRoot, SPLASHSCREEN_COLORSET_PATH);

  // ensure old SplashScreen colorSet is removed
  await fs.remove(colorsetPath);

  await writeColorsContentsJsonFileAsync({
    assetPath: colorsetPath,
    backgroundColor,
    darkBackgroundColor: darkBackgroundColor ?? null,
  });
}

async function writeColorsContentsJsonFileAsync({
  assetPath,
  backgroundColor,
  darkBackgroundColor,
}: {
  assetPath: string;
  backgroundColor: string;
  darkBackgroundColor: string | null;
}) {
  const color = parseColor(backgroundColor);
  const darkColor = darkBackgroundColor ? parseColor(darkBackgroundColor) : null;

  const colors: ContentsJsonColor[] = [
    {
      color: {
        components: {
          alpha: '1.000',
          blue: color.rgb.blue,
          green: color.rgb.green,
          red: color.rgb.red,
        },
        'color-space': 'srgb',
      },
      idiom: 'universal',
    },
  ];

  if (darkColor) {
    colors.push({
      color: {
        components: {
          alpha: '1.000',
          blue: darkColor.rgb.blue,
          green: darkColor.rgb.green,
          red: darkColor.rgb.red,
        },
        'color-space': 'srgb',
      },
      idiom: 'universal',
      appearances: [
        {
          appearance: 'luminosity',
          value: 'dark',
        },
      ],
    });
  }
  debug(`create colors contents.json:`, assetPath);
  debug(`use colors:`, colors);
  await writeContentsJsonAsync(assetPath, { colors });
}

async function writeContentsJsonAsync(
  directory: string,
  { colors }: { colors: ContentsJsonColor[] }
): Promise<void> {
  await fs.ensureDir(directory);

  await fs.writeFile(
    join(directory, 'Contents.json'),
    JSON.stringify(
      {
        colors,
        info: {
          version: 1,
          // common practice is for the tool that generated the icons to be the "author"
          author: 'expo',
        },
      },
      null,
      2
    )
  );
}
