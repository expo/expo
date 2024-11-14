import path from 'path';

import { SupportedPlatform } from '../types';

export function getLinkingImplementationForPlatform(platform: SupportedPlatform) {
  switch (platform) {
    case 'ios':
    case 'macos':
    case 'tvos':
    case 'apple':
      return require('../platforms/apple');
    case 'android':
      return require('../platforms/android');
    case 'devtools':
      return require('../platforms/devtools');
  }
}

/**
 * Get the possible path to the pnpm isolated modules folder.
 */
export function getIsolatedModulesPath(packagePath: string, packageName: string): string | null {
  // Check if the project is using isolated modules, by checking
  // if the parent dir of `packagePath` is a `node_modules` folder.
  // Isolated modules installs dependencies in small groups such as:
  //   - /.pnpm/expo@50.x.x(...)/node_modules/@expo/cli
  //   - /.pnpm/expo@50.x.x(...)/node_modules/expo
  //   - /.pnpm/expo@50.x.x(...)/node_modules/expo-application
  // When isolated modules are detected, expand the `searchPaths`
  // to include possible nested dependencies.
  const maybeIsolatedModulesPath = path.join(
    packagePath,
    packageName.startsWith('@') && packageName.includes('/') ? '../..' : '..' // scoped packages are nested deeper
  );
  const isIsolatedModulesPath = path.basename(maybeIsolatedModulesPath) === 'node_modules';
  return isIsolatedModulesPath ? maybeIsolatedModulesPath : null;
}
