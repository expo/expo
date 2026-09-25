import fs from 'fs/promises';
import path from 'path';

import type { ExpoModuleConfig } from '../ExpoModuleConfig';
import { listFilesSorted } from '../utils';
import type {
  RNConfigDependencyIos,
  RNConfigReactNativePlatformsConfigIos,
} from './reactNativeConfig.types';

/** Find first *.podspec file in target directory */
const findPodspecFile = async (targetPath: string): Promise<string | null> => {
  const podspecFiles = await listFilesSorted(targetPath, (basename) => {
    return basename.endsWith('.podspec');
  });
  // NOTE(@kitten): Compare case-insensitively against basename of derived name
  const mainBasename = path.basename(targetPath).toLowerCase();
  const mainPodspecFile = podspecFiles.find(
    (podspecFile) => path.basename(podspecFile, '.podspec').toLowerCase() === mainBasename
  );
  return mainPodspecFile ?? podspecFiles[0] ?? null;
};

/** The CocoaPods platform name of each Apple platform that autolinking reports. */
const PODSPEC_PLATFORM_NAMES = { ios: 'ios', tvos: 'tvos', macos: 'osx' } as const;

type ApplePlatform = keyof typeof PODSPEC_PLATFORM_NAMES;

/**
 * Reads the platforms a podspec declares, or `null` when it does not spell them out.
 *
 * Podspecs are Ruby, so this only recognizes the literal forms: `:osx =>` and `osx:` hash keys, and
 * `s.osx.deployment_target`-style accessors. Comment lines are dropped first. A podspec that
 * computes its platforms (for example `s.platforms = min_supported_versions`) yields `null`, and
 * the caller keeps the dependency, because CocoaPods treats an unspecified platform list as
 * "all platforms".
 */
export async function readPodspecPlatformsAsync(podspecPath: string): Promise<Set<string> | null> {
  let contents: string;
  try {
    contents = await fs.readFile(podspecPath, 'utf8');
  } catch {
    return null;
  }
  const code = contents.replace(/^\s*#.*$/gm, '');
  const platforms = new Set<string>();
  const names = 'ios|osx|tvos|visionos|watchos';
  for (const re of [
    new RegExp(`:(${names})\\b`, 'g'),
    new RegExp(`(?<![\\w:.])(${names}):(?!:)`, 'g'),
    new RegExp(
      `\\.(${names})\\.(?:deployment_target|exclude_files|source_files|frameworks|dependency|resource_bundles|resources|vendored_frameworks|pod_target_xcconfig)\\b`,
      'g'
    ),
  ]) {
    for (const match of code.matchAll(re)) {
      platforms.add(match[1]!);
    }
  }
  return platforms.size > 0 ? platforms : null;
}

export async function resolveDependencyConfigImplIosAsync(
  resolution: { path: string; version: string },
  reactNativeConfig: RNConfigReactNativePlatformsConfigIos | null | undefined,
  expoModuleConfig?: ExpoModuleConfig | null,
  options?: {
    /**
     * The Apple platform being resolved. For `tvos` and `macos`, a dependency whose podspec
     * declares platforms without that one is skipped. The Podfile filters such pods anyway, but
     * codegen and Metro consume this config too and would otherwise reference native code that
     * is never built.
     */
    platform?: ApplePlatform;
  }
): Promise<RNConfigDependencyIos | null> {
  if (reactNativeConfig === null) {
    // Skip autolinking for this package.
    return null;
  }

  const podspecPath = await findPodspecFile(resolution.path);
  if (!podspecPath) {
    return null;
  }

  const platform = options?.platform;
  if (platform && platform !== 'ios') {
    const declaredPlatforms = await readPodspecPlatformsAsync(podspecPath);
    if (declaredPlatforms && !declaredPlatforms.has(PODSPEC_PLATFORM_NAMES[platform])) {
      return null;
    }
  }

  if (reactNativeConfig === undefined && expoModuleConfig?.supportsPlatform('apple')) {
    // Check if Expo podspec files contain the React Native podspec file
    const overlappingPodspecPath = expoModuleConfig.applePodspecPaths().find((targetFile) => {
      const expoPodspecPath = path.normalize(path.join(resolution.path, targetFile));
      return expoPodspecPath === path.normalize(podspecPath);
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
