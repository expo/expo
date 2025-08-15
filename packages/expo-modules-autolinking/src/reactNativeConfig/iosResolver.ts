import { glob } from 'glob';
import path from 'path';

import type {
  RNConfigDependencyIos,
  RNConfigReactNativePlatformsConfigIos,
} from './reactNativeConfig.types';
import type { ExpoModuleConfig } from '../ExpoModuleConfig';

export async function resolveDependencyConfigImplIosAsync(
  resolution: { path: string; version: string },
  reactNativeConfig: RNConfigReactNativePlatformsConfigIos | null | undefined,
  expoModuleConfig?: ExpoModuleConfig | null
): Promise<RNConfigDependencyIos | null> {
  if (reactNativeConfig === null) {
    // Skip autolinking for this package.
    return null;
  }

  const podspecs = await glob('*.podspec', { cwd: resolution.path });
  if (!podspecs?.length) {
    return null;
  }

  const mainPackagePodspec = path.basename(resolution.path) + '.podspec';
  const podspecFile = podspecs.includes(mainPackagePodspec)
    ? mainPackagePodspec
    : podspecs.sort((a, b) => a.localeCompare(b))[0];
  const podspecPath = path.join(resolution.path, podspecFile);

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
