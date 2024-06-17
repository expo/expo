import fs from 'fs/promises';
import path from 'path';

import { resolveDependencyConfigImplAndroidAsync } from './androidCompat';
import { resolveDependencyConfigImplIosAsync } from './iosCompat';
import { loadReactNativeConfigAsync } from './reactNativeConfig';
import type {
  RncConfigCompatDependencyConfig,
  RncConfigCompatOptions,
  RncConfigCompatReactNativeLibraryConfig,
  RncConfigCompatReactNativeProjectConfig,
  RncConfigCompatResult,
} from './rncConfigCompat.types';
import { fileExistsAsync } from './utils';
import { getIsolatedModulesPath } from '../autolinking/utils';
import type { SupportedPlatform } from '../types';

/**
 * Create @react-native-community/cli compatible config for autolinking.
 */
export async function createRncConfigCompatAsync({
  platform,
  projectRoot,
  searchPaths,
}: RncConfigCompatOptions): Promise<RncConfigCompatResult> {
  const projectConfig =
    await loadReactNativeConfigAsync<RncConfigCompatReactNativeProjectConfig>(projectRoot);
  const dependencyRoots = await findDependencyRootsAsync(projectRoot, searchPaths);
  const reactNativePath = dependencyRoots['react-native'];

  const dependencyConfigs = await Promise.all(
    Object.entries(dependencyRoots).map(async ([name, packageRoot]) => {
      const config = await resolveDependencyConfigAsync(platform, name, packageRoot, projectConfig);
      return [name, config];
    })
  );
  const dependencyResults = Object.fromEntries<RncConfigCompatDependencyConfig>(
    dependencyConfigs.filter(([, config]) => config != null) as Iterable<
      [string, RncConfigCompatDependencyConfig]
    >
  );
  const projectData =
    platform === 'ios' ? { ios: { sourceDir: path.join(projectRoot, 'ios') } } : {};
  return {
    root: projectRoot,
    reactNativePath,
    dependencies: dependencyResults,
    project: projectData,
  };
}

/**
 * Find all dependencies and their directories from the project.
 */
export async function findDependencyRootsAsync(
  projectRoot: string,
  searchPaths: string[]
): Promise<Record<string, string>> {
  const packageJson = JSON.parse(await fs.readFile(path.join(projectRoot, 'package.json'), 'utf8'));
  const dependencies = [
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
  ];

  const results: Record<string, string> = {};
  // `searchPathSet` can be mutated to discover all "isolated modules groups", when using isolated modules
  const searchPathSet = new Set(searchPaths);

  for (const name of dependencies) {
    for (const searchPath of searchPathSet) {
      const packageConfigPath = path.resolve(searchPath, name, 'package.json');
      if (await fileExistsAsync(packageConfigPath)) {
        const packageRoot = path.dirname(packageConfigPath);
        results[name] = packageRoot;

        const maybeIsolatedModulesPath = getIsolatedModulesPath(packageRoot, name);
        if (maybeIsolatedModulesPath) {
          searchPathSet.add(maybeIsolatedModulesPath);
        }
        break;
      }
    }
  }

  return results;
}

export async function resolveDependencyConfigAsync(
  platform: SupportedPlatform,
  name: string,
  packageRoot: string,
  projectConfig: RncConfigCompatReactNativeProjectConfig | null
): Promise<RncConfigCompatDependencyConfig | null> {
  const libraryConfig =
    await loadReactNativeConfigAsync<RncConfigCompatReactNativeLibraryConfig>(packageRoot);
  const reactNativeConfig = {
    ...libraryConfig?.dependency,
    ...projectConfig?.dependencies[name],
  };

  if (Object.keys(libraryConfig?.platforms ?? {}).length > 0) {
    // Package defines platforms would be a platform host package.
    // The rnc-cli will skip this package.
    // For example, the `react-native` package.
    return null;
  }

  let platformData = null;
  if (platform === 'android') {
    platformData = await resolveDependencyConfigImplAndroidAsync(
      packageRoot,
      reactNativeConfig.platforms?.android
    );
  } else if (platform === 'ios') {
    platformData = await resolveDependencyConfigImplIosAsync(
      packageRoot,
      reactNativeConfig.platforms?.ios
    );
  }
  if (!platformData) {
    return null;
  }
  return {
    root: packageRoot,
    name,
    platforms: {
      [platform]: platformData,
    },
  };
}
