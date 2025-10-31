import fs from 'fs';
import path from 'path';

import type {
  RNConfigDependencyIos,
  RNConfigReactNativePlatformsConfigIos,
} from './reactNativeConfig.types';
import type { ExpoModuleConfig } from '../ExpoModuleConfig';
import { listFilesSorted } from '../utils';

/** Find first *.podspec file in target directory */
const findPodspecFile = async (targetPath: string): Promise<string | null> => {
  const podspecFiles = await listFilesSorted(targetPath, (basename) =>
    basename.endsWith('.podspec')
  );
  return podspecFiles.length > 0 ? podspecFiles[0] : null;
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
