import resolveFrom from 'resolve-from';

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
