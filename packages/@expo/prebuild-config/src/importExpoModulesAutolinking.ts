// NOTE: Keep these types in-sync with expo-modules-autolinking

export type SearchResults = {
  [moduleName: string]: object;
};

export type SearchOptions = {
  searchPaths: string[];
  platform: 'ios' | 'android' | 'web';
  silent?: boolean;
};

export type AutolinkingModule = {
  resolveSearchPathsAsync(searchPaths: string[] | null, cwd: string): Promise<string[]>;
  findModulesAsync(providedOptions: SearchOptions): Promise<SearchResults>;
};

/**
 * Imports the `expo-modules-autolinking` package installed in the project at the given path.
 */
export function importExpoModulesAutolinking(projectRoot: string): AutolinkingModule {
  const autolinking = tryRequireExpoModulesAutolinking(projectRoot);
  assertAutolinkingCompatibility(autolinking);
  return autolinking;
}

function tryRequireExpoModulesAutolinking(projectRoot: string): AutolinkingModule {
  try {
    const resolvedAutolinkingPath = require.resolve('expo-modules-autolinking/build/autolinking', {
      paths: [projectRoot],
    });
    return require(resolvedAutolinkingPath);
  } catch {
    throw new Error(
      "Cannot find 'expo-modules-autolinking' package in your project, make sure that you have 'expo' package installed"
    );
  }
}

function assertAutolinkingCompatibility(autolinking: AutolinkingModule): void {
  if ('resolveSearchPathsAsync' in autolinking && 'findModulesAsync' in autolinking) {
    return;
  }
  throw new Error(
    "The 'expo-modules-autolinking' package has been found, but it seems to be incompatible with '@expo/prebuild-config'"
  );
}
