import {
  ConfigPlugin,
  InfoPlist,
  IOSConfig,
  withDangerousMod,
  withInfoPlist,
  withXcodeProject,
} from 'expo/config-plugins';
import fs from 'fs';
import path from 'path';

import type { PrerenderConfig } from './types';

export const PRERENDER_FILE_NAME = 'SplashScreenPrerender.json';
/** Info.plist key that turns on capturing the first screen for the next launch. */
export const PRERENDER_SNAPSHOT_PLIST_KEY = 'ExpoSplashScreenPrerenderSnapshot';

export function normalizePrerender(prerender?: string | PrerenderConfig): PrerenderConfig {
  return typeof prerender === 'string' ? { component: prerender } : (prerender ?? {});
}

export function setPrerenderSnapshotInfoPlist(infoPlist: InfoPlist, prerender: PrerenderConfig): InfoPlist {
  if (prerender.snapshot) {
    infoPlist[PRERENDER_SNAPSHOT_PLIST_KEY] = true;
  } else {
    delete infoPlist[PRERENDER_SNAPSHOT_PLIST_KEY];
  }
  return infoPlist;
}

// A component (anything but `.json`) is rendered by `expo export:embed` at build time and written
// next to the JS bundle; only a prebuilt JSON template is copied into the native project here.
const templateFileOf = (prerender: PrerenderConfig): string | null =>
  prerender.component?.endsWith('.json') ? prerender.component : null;

export const withIosSplashPrerender: ConfigPlugin<{ prerender?: string | PrerenderConfig }> = (
  config,
  props
) => {
  const prerender = normalizePrerender(props.prerender);
  config = withInfoPlist(config, (config) => {
    config.modResults = setPrerenderSnapshotInfoPlist(config.modResults, prerender);
    return config;
  });
  const templateFile = templateFileOf(prerender);
  if (!templateFile) {
    return config;
  }
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const source = path.resolve(config.modRequest.projectRoot, templateFile);
      const destination = path.join(
        config.modRequest.platformProjectRoot,
        config.modRequest.projectName!,
        PRERENDER_FILE_NAME
      );
      await fs.promises.copyFile(source, destination);
      return config;
    },
  ]);
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const filepath = path.join(config.modRequest.projectName!, PRERENDER_FILE_NAME);
    if (!project.hasFile(filepath)) {
      IOSConfig.XcodeUtils.addResourceFileToGroup({
        filepath,
        groupName: config.modRequest.projectName!,
        project,
        isBuildFile: true,
      });
    }
    return config;
  });
};

export const withAndroidSplashPrerender: ConfigPlugin<{ prerender?: string | PrerenderConfig }> = (
  config,
  props
) => {
  // `snapshot` is iOS only for now.
  const templateFile = templateFileOf(normalizePrerender(props.prerender));
  if (!templateFile) {
    return config;
  }
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const source = path.resolve(config.modRequest.projectRoot, templateFile);
      const assetsDir = path.join(config.modRequest.platformProjectRoot, 'app', 'src', 'main', 'assets');
      await fs.promises.mkdir(assetsDir, { recursive: true });
      await fs.promises.copyFile(source, path.join(assetsDir, PRERENDER_FILE_NAME));
      return config;
    },
  ]);
};
