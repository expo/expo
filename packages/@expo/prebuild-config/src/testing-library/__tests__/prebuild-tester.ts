import './expect';

import { withInternal } from '@expo/config/build/plugins/withInternal';
import {
  AndroidConfig,
  compileModsAsync as compileInternalModsAsync,
  type ExportedConfig,
  IOSConfig,
  withPlugins,
} from '@expo/config-plugins';
import { getInfoPlistPathFromPbxproj } from '@expo/config-plugins/build/ios/utils/getInfoPlistPath';
import type { ExpoConfig } from '@expo/config-types';
import * as fs from 'fs-extra';
import { vol } from 'memfs';
import * as path from 'path';

import rnFixture from '../../plugins/__tests__/fixtures/react-native-project';
import {
  withAndroidExpoPlugins,
  withIosExpoPlugins,
  withVersionedExpoSDKPlugins,
} from '../../plugins/withDefaultPlugins';

jest.mock('fs');

export function getPrebuildConfig(exp: ExpoConfig): ExportedConfig {
  // let config = exp;
  let config = withPlugins(exp, exp.plugins ?? []);

  config = withVersionedExpoSDKPlugins(config);

  config = withIosExpoPlugins(config, {
    bundleIdentifier: config.ios?.bundleIdentifier ?? 'com.bacon.todo',
  });
  config = withAndroidExpoPlugins(config, {
    package: config.android?.package ?? 'com.bacon.todo',
  });
  return config;
}

const originalProcessPlatform = process.platform;

export function mockProcessPlatform(value: string) {
  Object.defineProperty(process, 'platform', {
    value,
  });
}

export function unmockProcessPlatform() {
  mockProcessPlatform(originalProcessPlatform);
}

export function applyTemplateFixture(projectRoot: string) {
  vol.fromJSON(rnFixture, projectRoot);
  return projectRoot;
}

function ensureConfigRequired(exp: Partial<ExportedConfig>): ExportedConfig {
  return {
    name: 'app',
    slug: 'slug',
    ...exp,
  };
}

export function compileModsAsync(
  exp: Partial<ExportedConfig>,
  props: Parameters<typeof compileInternalModsAsync>[1]
): Promise<ExportedConfig> {
  let config = ensureConfigRequired(exp);
  config = withInternal(config as any, {
    projectRoot: props.projectRoot,
    // ...(paths ?? {}),
    packageJsonPath: path.join(props.projectRoot, 'package.json'),
  });
  config = getPrebuildConfig(config);

  return compileInternalModsAsync(config, props);
}

export function getAndroidManifestLikePrebuild(config: ExpoConfig) {
  return AndroidConfig.Manifest.readAndroidManifestAsync(
    path.join(getProjectRootLikePrebuild(config), 'android/app/src/main/AndroidManifest.xml')
  );
}
export function getAndroidManifestStringLikePrebuild(config: ExpoConfig) {
  return fs.readFileSync(
    path.join(getProjectRootLikePrebuild(config), 'android/app/src/main/AndroidManifest.xml'),
    'utf-8'
  );
}

export function getProjectRootLikePrebuild(config: ExpoConfig): string {
  const projectRoot = config._internal?.projectRoot;
  if (!projectRoot) {
    throw new Error('Expected projectRoot to be defined on the config');
  }
  return projectRoot;
}

export function getInfoPlistPathLikePrebuild(config: ExpoConfig): string {
  const projectRoot = getProjectRootLikePrebuild(config);
  const project = IOSConfig.XcodeUtils.getPbxproj(projectRoot);
  const infoPlistBuildProperty = getInfoPlistPathFromPbxproj(project);
  if (!infoPlistBuildProperty) {
    throw new Error('Info.plist file linked to Xcode project does not exist');
  }

  //: [root]/myapp/ios/MyApp/Info.plist
  const infoPlistPath = path.join(
    //: myapp/ios
    projectRoot,
    'ios',
    //: MyApp/Info.plist
    infoPlistBuildProperty
  );
  if (fs.existsSync(infoPlistPath)) {
    return infoPlistPath;
  }

  console.warn(
    'mods.ios.infoPlist',
    `Info.plist file linked to Xcode project does not exist: ${infoPlistPath}`
  );
}
