import fs from 'fs/promises';
import path from 'path';

import {
  findGradleAndManifestAsync,
  parsePackageNameAsync,
  resolveDependencyConfigImplAndroidAsync,
} from './androidResolver';
import { loadConfigAsync } from './config';
import { resolveDependencyConfigImplIosAsync } from './iosResolver';
import type {
  RNConfigCommandOptions,
  RNConfigDependency,
  RNConfigReactNativeAppProjectConfig,
  RNConfigReactNativeLibraryConfig,
  RNConfigReactNativeProjectConfig,
  RNConfigResult,
} from './reactNativeConfig.types';
import { fileExistsAsync } from './utils';
import { getIsolatedModulesPath } from '../autolinking/utils';
import type { SupportedPlatform } from '../types';

/**
 * Create config for react-native core autolinking.
 */
export async function createReactNativeConfigAsync({
  platform,
  projectRoot,
  searchPaths,
}: RNConfigCommandOptions): Promise<RNConfigResult> {
  const projectConfig = await loadConfigAsync<RNConfigReactNativeProjectConfig>(projectRoot);
  const dependencyRoots = await findDependencyRootsAsync(projectRoot, searchPaths);
  const reactNativePath = dependencyRoots['react-native'];

  const dependencyConfigs = await Promise.all(
    Object.entries(dependencyRoots).map(async ([name, packageRoot]) => {
      const config = await resolveDependencyConfigAsync(platform, name, packageRoot, projectConfig);
      return [name, config];
    })
  );
  const dependencyResults = Object.fromEntries<RNConfigDependency>(
    dependencyConfigs.filter(([, config]) => config != null) as Iterable<
      [string, RNConfigDependency]
    >
  );
  const projectData = await resolveAppProjectConfigAsync(projectRoot, platform);
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
  projectConfig: RNConfigReactNativeProjectConfig | null
): Promise<RNConfigDependency | null> {
  const libraryConfig = await loadConfigAsync<RNConfigReactNativeLibraryConfig>(packageRoot);
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

export async function resolveAppProjectConfigAsync(
  projectRoot: string,
  platform: SupportedPlatform
): Promise<RNConfigReactNativeAppProjectConfig> {
  if (platform === 'android') {
    const androidDir = path.join(projectRoot, 'android');
    const { gradle, manifest } = await findGradleAndManifestAsync({ androidDir, isLibrary: false });
    const packageName = await parsePackageNameAsync(
      path.join(androidDir, manifest),
      path.join(androidDir, gradle)
    );

    return {
      android: {
        packageName: packageName ?? '',
        sourceDir: path.join(projectRoot, 'android'),
      },
    };
  }

  if (platform === 'ios') {
    return {
      ios: {
        sourceDir: path.join(projectRoot, 'ios'),
      },
    };
  }

  return {};
}
