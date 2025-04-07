import { withMainApplication } from '@expo/config-plugins';
import {
  addImports,
  appendContentsInsideDeclarationBlock,
} from '@expo/config-plugins/build/android/codeMod';
import { type ConfigPlugin, withDangerousMod } from 'expo/config-plugins';
import fs from 'fs/promises';
import path from 'path';

import {
  generateFontFamilyXml,
  normalizeFilename,
  resolveFontPaths,
  resolveXmlFontPaths,
} from './utils';

export type FontFiles = {
  font: string;
  fontStyle: 'normal' | 'italic';
  fontWeight: `${number}`;
};
export type XmlFonts = {
  files: FontFiles[];
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
    const fontsDir = path.join(config.modRequest.platformProjectRoot, 'app/src/main/res/font');
    await fs.mkdir(fontsDir, { recursive: true });

    const modResults = config.modResults;
    const isJava = modResults.language === 'java';
    modResults.contents = addImports(
      modResults.contents,
      ['com.facebook.react.common.assets.ReactFontManager'],
      isJava
    );

    Promise.all(
      fonts.map(async ({ fontName, files }) => {
        const xmlFileName = normalizeFilename(fontName);
        const resolvedFonts = await resolveXmlFontPaths(files, config.modRequest.projectRoot);
        const fontXml = generateFontFamilyXml(resolvedFonts);
        const xmlPath = path.join(fontsDir, `${xmlFileName}.xml`);
        await fs.writeFile(xmlPath, fontXml);

        await Promise.all(
          resolvedFonts.map(async (file) => {
            const destPath = path.join(fontsDir, path.basename(file.font));
            await fs.copyFile(path.resolve(__dirname, file.font), destPath);
          })
        );

        modResults.contents = appendContentsInsideDeclarationBlock(
          modResults.contents,
          'onCreate',
          `  ReactFontManager.getInstance().addCustomFont(this, "${fontName}", R.font.${xmlFileName})${isJava ? ';' : ''}\n  `
        );
      })
    );

    return config;
  });
};
