import fs from 'fs';
import path from 'path';

import type {
  RNConfigDependencyIos,
  RNConfigReactNativePlatformsConfigIos,
} from './reactNativeConfig.types';
import type { ExpoModuleConfig } from '../ExpoModuleConfig';

/** Find all *.podspec files in target directory */
const findPodspecFile = async (targetPath: string) => {
  try {
    const entries = (await fs.promises.readdir(targetPath, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.endsWith('.podspec'))
      .sort((a, b) => a.name.localeCompare(b.name));
    return entries.length > 0 ? path.join(targetPath, entries[0].name) : null;
  } catch {
    return null;
  }
};

export async function resolveDependencyConfigImplIosAsync(
  resolution: { path: string; version: string },
  reactNativeConfig: RNConfigReactNativePlatformsConfigIos | null | undefined,
  expoModuleConfig?: ExpoModuleConfig | null
): Promise<RNConfigDependencyIos | null> {
  if (reactNativeConfig === null) {
    // Skip autolinking for this package.
    return null;
  }

  const mainPackagePodspec = path.join(
    resolution.path,
    path.basename(resolution.path) + '.podspec'
  );
  const podspecPath = fs.existsSync(mainPackagePodspec)
    ? mainPackagePodspec
    : await findPodspecFile(resolution.path);
  if (!podspecPath) {
    return null;
  }

  if (reactNativeConfig === undefined && expoModuleConfig?.supportsPlatform('apple')) {
    // Check if Expo podspec files contain the React Native podspec file
    const overlappingPodspecPath = expoModuleConfig.applePodspecPaths().find((targetFile) => {
      const expoPodspecPath = path.join(resolution.path, targetFile);
      return expoPodspecPath === podspecPath;
    });
    // NOTE(@kitten): If we don't have a react-native.config.{js,ts} file and the
    // package is also an Expo module, we only link it as a React Native module
    // if both don't point at the same podspec file
    if (overlappingPodspecPath != null) {
      return null;
    }
  }

  return {
    podspecPath,
    version: resolution.version,
    configurations: reactNativeConfig?.configurations || [],
    scriptPhases: reactNativeConfig?.scriptPhases || [],
  };
}
