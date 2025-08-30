import type { DependencyResolution } from 'expo-modules-autolinking/exports';
import resolveFrom from 'resolve-from';

import { getVersionedNativeModuleNamesAsync } from './versionedNativeModules';

export function importAutolinkingExportsFromProject(
  projectDir: string
): typeof import('expo/internal/unstable-autolinking-exports') {
  const autolinkingExportsResolved = resolveFrom.silent(
    projectDir,
    'expo/internal/unstable-autolinking-exports'
  );
  if (!autolinkingExportsResolved) {
    throw new ExpoExportMissingError(
      `The packages "expo-modules-autolinking" or "expo" are out-of-date and checking dependency conflicts isn't possible.`
    );
  }
  try {
    const mod = require(autolinkingExportsResolved);
    if (
      typeof mod.makeCachedDependenciesLinker !== 'function' ||
      typeof mod.scanDependencyResolutionsForPlatform !== 'function'
    ) {
      // Double-check exports we need here, since it'd be annoying if doctor
      // failed if we ever break this API contract and someone uses an
      // older version of doctor
      throw new ExpoExportMissingError(
        `The package "expo-modules-autolinking" is out-of-date and isn't available to check dependency conflicts.`
      );
    }
    return mod;
  } catch (error: any) {
    if ('code' in error && error.code === 'MODULE_NOT_FOUND') {
      // NOTE(@kitten): This export is only available in SDK 54+
      throw new ExpoExportMissingError(
        `The package "expo-modules-autolinking" is out-of-date and isn't available to check dependency conflicts.`
      );
    }
    throw error;
  }
}

export class ExpoExportMissingError extends Error {}

export interface AutolinkingResolutionsCache {
  resolutions?: Promise<Map<string, DependencyResolution>>;
}

const AUTOLINKING_PLATFORMS = ['android', 'ios'] as const;

export const scanNativeModuleResolutions = (
  cache: AutolinkingResolutionsCache,
  params: {
    projectRoot: string,
    sdkVersion: string | undefined,
  },
): Promise<Map<string, DependencyResolution>> => {
  const _task = async () => {
    const bundledNativeModules = await getVersionedNativeModuleNamesAsync(
      params.projectRoot,
      params.sdkVersion!
    );

    const autolinking = importAutolinkingExportsFromProject(params.projectRoot);
    const linker = autolinking.makeCachedDependenciesLinker({ projectRoot: params.projectRoot });
    const dependenciesPerPlatform = await Promise.all(
      AUTOLINKING_PLATFORMS.map((platform) => {
        return autolinking.scanDependencyResolutionsForPlatform(
          linker,
          platform,
          bundledNativeModules || undefined
        );
      })
    );

    const resolutions = new Map<string, DependencyResolution>();
    for (const dependencyForPlatform of dependenciesPerPlatform) {
      for (const dependencyName in dependencyForPlatform) {
        const dependency = dependencyForPlatform[dependencyName];
        if (dependency) {
          resolutions.set(dependencyName, dependency);
        }
      }
    }
    return resolutions;
  };

  return cache.resolutions || (cache.resolutions = _task());
};
