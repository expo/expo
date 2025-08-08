import { glob } from 'glob';
import path from 'path';

import type {
  RNConfigDependencyIos,
  RNConfigReactNativePlatformsConfigIos,
} from './reactNativeConfig.types';

export async function resolveDependencyConfigImplIosAsync(
  resolution: { path: string; version: string },
  reactNativeConfig: RNConfigReactNativePlatformsConfigIos | null | undefined
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
  return {
    podspecPath,
    version: resolution.version,
    configurations: reactNativeConfig?.configurations || [],
    scriptPhases: reactNativeConfig?.scriptPhases || [],
  };
}
