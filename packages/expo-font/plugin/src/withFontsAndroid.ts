import type { ExpoConfig } from 'expo/config';
import {
  type ConfigPlugin,
  withDangerousMod,
  withMainApplication,
  XML,
  CodeGenerator,
  AndroidConfig,
} from 'expo/config-plugins';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import { resolveFontPaths, toValidAndroidResourceName } from './utils';
import type { Font, FontObject } from './withFonts';

const assetsFontsFir = 'app/src/main/assets/fonts';
const resourcesFontsDir = 'app/src/main/res/font';

export const withFontsAndroid: ConfigPlugin<Font[]> = (config, fonts) => {
  const assetFontPaths = fonts.filter((it) => typeof it === 'string');
  config = copyFontsToDir(config, assetFontPaths, assetsFontsFir);

  const xmlFonts = fonts.filter((it) => typeof it === 'object');
  config = addXmlFonts(config, xmlFonts);

  return config;
};

type GroupedFontObject = Record<string, FontObject['fontDefinitions']>;

export function groupByFamily(array: FontObject[]): GroupedFontObject {
  return array.reduce<GroupedFontObject>((result, item) => {
    const keyValue = item['fontFamily'];
    result[keyValue] ||= [];
    result[keyValue].push(...item.fontDefinitions);
    return result;
  }, {});
}

function addXmlFonts(config: ExpoConfig, xmlFontObjects: FontObject[]) {
  const fontsByFamily = groupByFamily(xmlFontObjects);

  const fontPaths = Object.values(fontsByFamily)
    .map((font) => font.map((it) => it.path))
    .flat();

  config = copyFontsToDir(config, fontPaths, resourcesFontsDir, (filenameWithExt) => {
    const filename = toValidAndroidResourceName(filenameWithExt);
    const ext = path.extname(filenameWithExt);
    return `${filename}${ext}`;
  });

  config = addFontXmlToMainApplication(config, fontsByFamily);

  return withDangerousMod(config, [
    'android',
    async (config) => {
      const fontsDir = path.join(config.modRequest.platformProjectRoot, 'app/src/main/res/font');

      const xmlSpecs = getXmlSpecs(fontsDir, fontsByFamily);

      await Promise.all(xmlSpecs.map(XML.writeXMLAsync));

      return config;
    },
  ]);
}

const resourceNameConflictAvoidancePrefix = 'xml_';

export function getXmlSpecs(fontsDir: string, xmlFontObjects: GroupedFontObject) {
  return Object.entries(xmlFontObjects).map(([fontFamily, fontDefinitions]) => {
    const filePath = path.join(
      fontsDir,
      `${resourceNameConflictAvoidancePrefix + toValidAndroidResourceName(fontFamily)}.xml`
    );
    // each font family has one xml resource file with potentially multiple font definitions
    // the font files (e.g. ttf) at `path` are copied to res/font
    // with their name changed to be a valid resource and referenced in the xml file
    return {
      path: filePath,
      xml: {
        'font-family': {
          // using `app` namespace for better compat:
          // https://developer.android.com/develop/ui/views/text-and-emoji/fonts-in-xml#using-support-lib
          $: {
            'xmlns:app': 'http://schemas.android.com/apk/res-auto',
          },
          font: fontDefinitions.map((definition) => {
            return {
              $: {
                'app:font': `@font/${toValidAndroidResourceName(definition.path)}`,
                'app:fontStyle': definition.style || 'normal',
                'app:fontWeight': String(definition.weight),
              },
            };
          }),
        },
      },
    };
  });
}

function addFontXmlToMainApplication(config: ExpoConfig, xmlFontObjects: GroupedFontObject) {
  return withMainApplication(config, (config) => {
    const {
      modResults,
      modResults: { language },
    } = config;

    modResults.contents = AndroidConfig.CodeMod.addImports(
      modResults.contents,
      ['com.facebook.react.common.assets.ReactFontManager'],
      language === 'java'
    );

    const fontManagerCalls = generateFontManagerCalls(xmlFontObjects, language).join(os.EOL);

    const withInit = CodeGenerator.mergeContents({
      src: modResults.contents,
      comment: '    //',
      tag: 'xml-fonts-init',
      offset: 1,
      anchor: /super\.onCreate\(\)/,
      newSrc: fontManagerCalls,
    });

    return {
      ...config,
      modResults: {
        ...modResults,
        contents: withInit.contents,
      },
    };
  });
}

export function generateFontManagerCalls(
  xmlFontObjects: GroupedFontObject,
  language: 'java' | 'kt'
) {
  const lineEnding = language === 'java' ? ';' : '';
  const indent = '    ';

  return Object.keys(xmlFontObjects).map(
    (family) =>
      `${indent}ReactFontManager.getInstance().addCustomFont(this, "${family}", R.font.${resourceNameConflictAvoidancePrefix + toValidAndroidResourceName(family)})${lineEnding}`
  );
}

function copyFontsToDir(
  config: ExpoConfig,
  paths: string[],
  inAppDestination: typeof assetsFontsFir | typeof resourcesFontsDir,
  filenameProcessor = (filenameWithExt: string) => filenameWithExt
) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const fontsDir = path.join(config.modRequest.platformProjectRoot, inAppDestination);
      await fs.mkdir(fontsDir, { recursive: true });

      const resolvedFonts = await resolveFontPaths(paths, config.modRequest.projectRoot);

      await Promise.all(
        resolvedFonts.map(async (asset) => {
          const filenameWithExt = path.basename(asset);
          const outputFileName = filenameProcessor(filenameWithExt);
          const output = path.join(fontsDir, outputFileName);
          if (output.endsWith('.ttf') || output.endsWith('.otf')) {
            await fs.copyFile(asset, output);
          }
        })
      );
      return config;
    },
  ]);
}
