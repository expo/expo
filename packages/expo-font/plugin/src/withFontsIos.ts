import { ExpoConfig } from '@expo/config-types';
import {
  ConfigPlugin,
  IOSConfig,
  XcodeProject,
  withInfoPlist,
  withXcodeProject,
} from 'expo/config-plugins';
import path from 'path';

import { resolveFontPaths } from './utils';

export const withFontsIos: ConfigPlugin<string[]> = (config, fonts) => {
  config = addFontsToTarget(config, fonts);
  config = addFontsToPlist(config, fonts);
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
    const existingFonts = config.modResults.UIAppFonts || [];

    const fontList = resolvedFonts.map((font) => path.basename(font)) ?? [];
    const allFonts = [...existingFonts, ...fontList];
    config.modResults.UIAppFonts = Array.from(new Set(allFonts));

    return config;
  });
}

function addResourceFile(project: XcodeProject, platformRoot: string, f: string[]) {
  return f
    .map((font) => {
      const fontPath = path.relative(platformRoot, font);
      return project.addResourceFile(fontPath, {
        target: project.getFirstTarget().uuid,
      });
    })
    .filter(Boolean)
    .map((file) => file.basename);
}
