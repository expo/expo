import { ConfigPlugin, IOSConfig, withDangerousMod } from 'expo/config-plugins';
import fs from 'fs';
import path from 'path';

import { parseColor } from './InterfaceBuilder';
import { IOSSplashConfig } from './types';

export const SPLASHSCREEN_COLORSET_PATH = 'Images.xcassets/SplashScreenBackground.colorset';

const darkAppearances = [{ appearance: 'luminosity', value: 'dark' }] as const;

interface ContentsJsonColor {
  appearances?: typeof darkAppearances;
  idiom: 'universal';
  color: {
    'color-space': 'srgb';
    components: {
      alpha: string;
      blue: string;
      green: string;
      red: string;
    };
  };
}

export const withIosSplashColors: ConfigPlugin<IOSSplashConfig> = (config, splash) => {
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
  darkBackgroundColor: string | undefined;
}) {
  const colorsetPath = path.resolve(iosNamedProjectRoot, SPLASHSCREEN_COLORSET_PATH);

  // ensure old SplashScreen colorSet is removed
  await fs.promises.rm(colorsetPath, { force: true, recursive: true });

  await writeColorsContentsJsonFileAsync({
    assetPath: colorsetPath,
    backgroundColor,
    darkBackgroundColor,
  });
}

async function writeColorsContentsJsonFileAsync({
  assetPath,
  backgroundColor,
  darkBackgroundColor,
}: {
  assetPath: string;
  backgroundColor: string;
  darkBackgroundColor: string | undefined;
}) {
  const color = parseColor(backgroundColor);
  const darkColor = darkBackgroundColor ? parseColor(darkBackgroundColor) : undefined;

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
      appearances: darkAppearances,
    });
  }

  await fs.promises.mkdir(assetPath, { recursive: true });
  await fs.promises.writeFile(
    path.join(assetPath, 'Contents.json'),
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
    ),
    'utf8'
  );
}
