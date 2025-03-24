import { withMainApplication } from '@expo/config-plugins';
import {
  addImports,
  appendContentsInsideDeclarationBlock,
} from '@expo/config-plugins/build/android/codeMod';
import { type ConfigPlugin, withDangerousMod } from 'expo/config-plugins';
import fs from 'fs/promises';
import path from 'path';

import { generateFontFamilyXml, resolveFontPaths } from './utils';

export type XmlFonts = {
  fontFiles: string[];
  fontName: string;
};

export const withFontsAndroid: ConfigPlugin<string[]> = (config, fonts) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const resolvedFonts = await resolveFontPaths(fonts, config.modRequest.projectRoot);
      await Promise.all(
        resolvedFonts.map(async (asset) => {
          const fontsDir = path.join(
            config.modRequest.platformProjectRoot,
            'app/src/main/assets/fonts'
          );
          await fs.mkdir(fontsDir, { recursive: true });
          const output = path.join(fontsDir, path.basename(asset));
          if (output.endsWith('.ttf') || output.endsWith('.otf')) {
            await fs.copyFile(asset, output);
          }
        })
      );
      return config;
    },
  ]);
};

export const withXmlFontsAndroid: ConfigPlugin<XmlFonts[]> = (config, fonts) => {
  return withMainApplication(config, async (config) => {
    for (const { fontName, fontFiles } of fonts) {
      const xmlFileName = fontName.toLowerCase().replace(/ /g, '_')!;
      const resolvedFonts = await resolveFontPaths(fontFiles, config.modRequest.projectRoot);
      const fontXml = generateFontFamilyXml(resolvedFonts);
      const fontsDir = path.join(config.modRequest.platformProjectRoot, 'app/src/main/res/font');
      await fs.mkdir(fontsDir, { recursive: true });
      const xmlPath = path.join(fontsDir, `${xmlFileName}.xml`);
      await fs.writeFile(xmlPath, fontXml);

      await Promise.all(
        resolvedFonts.map(async (file) => {
          const destPath = path.join(fontsDir, path.basename(file));
          await fs.copyFile(path.resolve(__dirname, file), destPath);
        })
      );

      const isJava = config.modResults.language === 'java';
      config.modResults.contents = addImports(
        config.modResults.contents,
        ['com.facebook.react.common.assets.ReactFontManager'],
        isJava
      );
      config.modResults.contents = appendContentsInsideDeclarationBlock(
        config.modResults.contents,
        'onCreate',
        `  ReactFontManager.getInstance().addCustomFont(this, "${fontName}", R.font.${xmlFileName})${isJava ? ';' : ''}\n  `
      );
    }

    return config;
  });
};
