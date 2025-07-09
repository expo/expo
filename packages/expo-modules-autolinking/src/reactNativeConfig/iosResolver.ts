import fs from 'fs/promises';
import { glob } from 'glob';
import path from 'path';

import type {
  RNConfigDependencyIos,
  RNConfigReactNativePlatformsConfigIos,
} from './reactNativeConfig.types';

export async function resolveDependencyConfigImplIosAsync(
  packageRoot: string,
  reactNativeConfig: RNConfigReactNativePlatformsConfigIos | null | undefined
): Promise<RNConfigDependencyIos | null> {
  if (reactNativeConfig === null) {
    // Skip autolinking for this package.
    return null;
  }

  const podspecs = await glob('*.podspec', { cwd: packageRoot });
  if (!podspecs?.length) {
    return null;
  }
  const mainPackagePodspec = path.basename(packageRoot) + '.podspec';
  const podspecFile = podspecs.includes(mainPackagePodspec)
    ? mainPackagePodspec
    : podspecs.sort((a, b) => a.localeCompare(b))[0];
  const podspecPath = path.join(packageRoot, podspecFile);

  const packageJson = JSON.parse(await fs.readFile(path.join(packageRoot, 'package.json'), 'utf8'));

  return {
    podspecPath,
    version: packageJson.version,
    configurations: reactNativeConfig?.configurations || [],
    scriptPhases: reactNativeConfig?.scriptPhases || [],
  };
}
