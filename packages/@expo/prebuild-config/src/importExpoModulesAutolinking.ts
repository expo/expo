import resolveFrom from 'resolve-from';

export type SearchResults = {
  [moduleName: string]: object;
};

export type SearchOptions = {
  searchPaths: string[];
  platform: 'ios' | 'android' | 'web';
  silent?: boolean;
};

type AutolinkingModule = typeof import('expo-modules-autolinking/exports');

/**
 * Imports the `expo-modules-autolinking` package installed in the project at the given path.
 */
export function importExpoModulesAutolinking(projectRoot: string): AutolinkingModule {
  const autolinking = tryRequireExpoModulesAutolinking(projectRoot);
  assertAutolinkingCompatibility(autolinking);
  return autolinking;
}

function tryRequireExpoModulesAutolinking(projectRoot: string): AutolinkingModule {
  const expoPackageRoot = resolveFrom.silent(projectRoot, 'expo/package.json');
  const autolinkingExportsPath = resolveFrom.silent(
    expoPackageRoot ?? projectRoot,
    'expo-modules-autolinking/exports'
  );
  if (!autolinkingExportsPath) {
    throw new Error(
      "Cannot find 'expo-modules-autolinking' package in your project, make sure that you have 'expo' package installed"
    );
  }
  return require(autolinkingExportsPath);
}

function assertAutolinkingCompatibility(autolinking: AutolinkingModule): void {
  if ('resolveSearchPathsAsync' in autolinking && 'findModulesAsync' in autolinking) {
    return;
  }
  throw new Error(
    "The 'expo-modules-autolinking' package has been found, but it seems to be incompatible with '@expo/prebuild-config'"
  );
}
