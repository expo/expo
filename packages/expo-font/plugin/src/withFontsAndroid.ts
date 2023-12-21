import {
  addImports,
  appendContentsInsideDeclarationBlock,
} from '@expo/config-plugins/build/android/codeMod';
import { ExpoConfig } from '@expo/config-types';
import { type ConfigPlugin, withDangerousMod, withMainApplication, XML } from 'expo/config-plugins';
import fs from 'fs/promises';
import path from 'path';

import { groupBy, toAndroidResourceString, resolveFontPaths } from './utils';
import type { Font, FontObject } from './withFonts';

export const withFontsAndroid: ConfigPlugin<Font[]> = (config, fonts) => {
  config = addFontsInDir(config, fonts);
  config = appendCustomFontCodeToMainApp(config, fonts);

  return config;
};

function appendCustomFontCodeToMainApp(config: ExpoConfig, fonts: Font[]) {
  const fontObjects = fonts.filter((f) => typeof f !== 'string') as FontObject[];
  const fontsByFamily = groupBy(fontObjects, 'family');

  config = addFontXmlToMainApplication(config, Object.keys(fontsByFamily));

  return withDangerousMod(config, [
    'android',
    async (config) => {
      const fontsDir = path.join(config.modRequest.platformProjectRoot, 'app/src/main/res/font');

      await Promise.all(
        Object.values(fontsByFamily).map((fonts) => {
          return XML.writeXMLAsync({
            path: path.join(fontsDir, `${toAndroidResourceString(fonts[0].family)}.xml`),
            xml: {
              'font-family': {
                $: {
                  'xmlns:app': 'http://schemas.android.com/apk/res-auto',
                },
                font: fonts.map((font) => ({
                  $: {
                    'app:fontStyle': font.style || 'normal',
                    'app:fontWeight': font.weight,
                    'app:font': `@font/${path.parse(font.path).name}`,
                  },
                })),
              },
            },
          });
        })
      );

      return config;
    },
  ]);
}

function fontManagerCode(family: string) {
  return `ReactFontManager.getInstance().addCustomFont(this, "${family}", R.font.${toAndroidResourceString(
    family
  )});`;
}

function addFontXmlToMainApplication(config: ExpoConfig, families: string[]) {
  return withMainApplication(config, async (config) => {
    config.modResults.contents = addImports(
      config.modResults.contents,
      ['com.facebook.react.common.assets.ReactFontManager'],
      config.modResults.language === 'java'
    );

    config.modResults.contents = appendContentsInsideDeclarationBlock(
      config.modResults.contents,
      'onCreate',
      families.map(fontManagerCode).join('\n')
    );

    return config;
  });
}

function addFontsInDir(config: ExpoConfig, fonts: Font[]) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const paths = fonts.map((font) => (typeof font === 'string' ? font : font.path));

      const resolvedFonts = await resolveFontPaths(paths, config.modRequest.projectRoot);
      const fontsDir = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/assets/fonts'
      );
      await fs.mkdir(fontsDir, { recursive: true });

      await Promise.all(
        resolvedFonts.map(async (asset) => {
          const output = path.join(fontsDir, path.basename(asset));
          if (output.endsWith('.ttf') || output.endsWith('.otf')) {
            await fs.copyFile(asset, output);
          }
        })
      );
      return config;
    },
  ]);
}
