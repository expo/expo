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

/**
 * The font files to copy, once each. A variable font backs one definition per weight, so the same
 * path shows up several times, and copying it once per definition races two writes onto the same
 * destination file.
 */
export function getFontPaths(fontsByFamily: GroupedFontObject): string[] {
  return [
    ...new Set(
      Object.values(fontsByFamily).flatMap((definitions) => definitions.map((it) => it.path))
    ),
  ];
}

/**
 * Throws when two definitions in the same family claim the same weight and style.
 *
 * Android resolves a family by (weight, style), and `FontFamily.Builder.addFont` rejects a second
 * font carrying a pair the family already holds — which surfaces as a crash while
 * `MainApplication.onCreate` registers the family, long after prebuild. Listing one variable font
 * file once per weight stays legal; repeating a weight does not.
 */
export function assertNoConflictingDefinitions(fontsByFamily: GroupedFontObject) {
  for (const [fontFamily, definitions] of Object.entries(fontsByFamily)) {
    const pathByWeightAndStyle = new Map<string, string>();

    for (const definition of definitions) {
      const style = definition.style || 'normal';
      const key = `${definition.weight}/${style}`;
      const alreadyDeclaredBy = pathByWeightAndStyle.get(key);

      if (alreadyDeclaredBy) {
        throw new Error(
          `Font family ${JSON.stringify(fontFamily)} declares more than one font for weight ${definition.weight} and style ${JSON.stringify(style)}: ${alreadyDeclaredBy} and ${definition.path}. ` +
            `Android resolves a font family by weight and style, so it cannot hold two fonts with the same pair — the app would crash on startup while registering the family. ` +
            `Remove the duplicate, or give each definition a weight or style of its own. One variable font file can back several weights, but each definition needs a different weight.`
        );
      }

      pathByWeightAndStyle.set(key, definition.path);
    }
  }
}

function addXmlFonts(config: ExpoConfig, xmlFontObjects: FontObject[]) {
  const fontsByFamily = groupByFamily(xmlFontObjects);
  assertNoConflictingDefinitions(fontsByFamily);
  const fontPaths = getFontPaths(fontsByFamily);

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
                // Instances a variable font at the declared weight, so that one file can back
                // several definitions. Static fonts have no `wght` axis and ignore it.
                'app:fontVariationSettings': `'wght' ${definition.weight}`,
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
      `${indent}ReactFontManager.getInstance().addCustomFont(this, ${JSON.stringify(family)}, R.font.${resourceNameConflictAvoidancePrefix + toValidAndroidResourceName(family)})${lineEnding}`
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
