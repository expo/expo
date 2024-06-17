import glob from 'fast-glob';
import fs from 'fs/promises';
import path from 'path';

import type {
  RncConfigCompatDependencyConfigIos,
  RncConfigCompatReactNativePlatformsConfigIos,
} from './rncConfigCompat.types';

export async function resolveDependencyConfigImplIosAsync(
  packageRoot: string,
  reactNativeConfig: RncConfigCompatReactNativePlatformsConfigIos | null | undefined
): Promise<RncConfigCompatDependencyConfigIos | null> {
  if (reactNativeConfig === null) {
    // Skip autolinking for this package.
    return null;
  }

  const podspecPath = (await glob('*.podspec', { cwd: packageRoot, absolute: true }))?.[0];
  if (!podspecPath) {
    return null;
  }
  const packageJson = JSON.parse(await fs.readFile(path.join(packageRoot, 'package.json'), 'utf8'));

  return {
    podspecPath,
    version: packageJson.version,
    configurations: reactNativeConfig?.configurations || [],
    scriptPhases: reactNativeConfig?.scriptPhases || [],
  };
}
