// This package needs to be imported from within the project to

import resolveFrom from 'resolve-from';

// ensure that Metro can bundle the project's assets (see: `watchFolders`).
export function importMetroConfig(projectRoot: string): typeof import('metro-config') & {
  getDefaultConfig: import('metro-config/src/defaults/index').default;
} {
  const modulePath = resolveFrom.silent(projectRoot, 'metro-config');

  if (!modulePath) {
    return require('metro-config');
  }
  return require(modulePath);
}
