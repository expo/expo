// TODO(@kitten): is this invalid/redundant with @expo/metro?
// This package needs to be imported from within the project to

import resolveFrom from 'resolve-from';

// ensure that Metro can bundle the project's assets (see: `watchFolders`).
export function importMetroConfig(projectRoot: string): typeof import('@expo/metro/metro-config') {
  const modulePath = resolveFrom.silent(projectRoot, 'metro-config');
  if (!modulePath) {
    return require('@expo/metro/metro-config');
  }
  return require(modulePath);
}
