import resolveFrom from 'resolve-from';

export function importAutolinkingExportsFromProject(
  projectDir: string
): typeof import('expo/internal/unstable-autolinking-exports') | null {
  const autolinkingExportsResolved = resolveFrom.silent(
    projectDir,
    'expo/internal/unstable-autolinking-exports'
  );
  if (!autolinkingExportsResolved) {
    return null;
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
      return null;
    }
    return mod;
  } catch (error: any) {
    if ('code' in error && error.code === 'MODULE_NOT_FOUND') {
      // NOTE(@kitten): This export is only available in SDK 54+
      return null;
    }
    throw error;
  }
}

class ExpoPackageMissingError extends Error {}
