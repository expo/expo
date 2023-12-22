import type { ExpoConfig } from 'expo/config';
import {
  type ConfigPlugin,
  IOSConfig,
  type InfoPlist,
  type XcodeProject,
  withInfoPlist,
  withXcodeProject,
} from 'expo/config-plugins';
import path from 'path';

import { resolveFontPaths } from './utils';
import type { Font } from './withFonts';

export const withFontsIos: ConfigPlugin<Font[]> = (config, fonts) => {
  const fontPaths = fonts.map((font) => (typeof font === 'string' ? font : font.path));

  config = addFontsToTarget(config, fontPaths);
  config = addFontsToPlist(config, fontPaths);
  return config;
};

function addFontsToTarget(config: ExpoConfig, fonts: string[]) {
  return withXcodeProject(config, async (config) => {
    const resolvedFonts = await resolveFontPaths(fonts, config.modRequest.projectRoot);
    const project = config.modResults;
    const platformProjectRoot = config.modRequest.platformProjectRoot;
    IOSConfig.XcodeUtils.ensureGroupRecursively(project, 'Resources');
    addResourceFile(project, platformProjectRoot, resolvedFonts);
    return config;
  });
}

function addFontsToPlist(config: ExpoConfig, fonts: string[]) {
  return withInfoPlist(config, async (config) => {
    const resolvedFonts = await resolveFontPaths(fonts, config.modRequest.projectRoot);
    const existingFonts = getUIAppFonts(config.modResults);

    const fontList = resolvedFonts.map((font) => path.basename(font)) ?? [];
    const allFonts = [...existingFonts, ...fontList];
    config.modResults.UIAppFonts = Array.from(new Set(allFonts));

    return config;
  });
}

function addResourceFile(project: XcodeProject, platformRoot: string, f: string[]) {
  for (const font of f) {
    const fontPath = path.relative(platformRoot, font);
    IOSConfig.XcodeUtils.addResourceFileToGroup({
      filepath: fontPath,
      groupName: 'Resources',
      project,
      isBuildFile: true,
      verbose: true,
    });
  }
}

function getUIAppFonts(infoPlist: InfoPlist): string[] {
  const fonts = infoPlist['UIAppFonts'];
  if (fonts != null && Array.isArray(fonts) && fonts.every((font) => typeof font === 'string')) {
    return fonts as string[];
  }
  return [];
}
