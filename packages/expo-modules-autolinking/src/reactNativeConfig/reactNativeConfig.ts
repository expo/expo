import fs from 'fs/promises';
import path from 'path';
import resolveFrom from 'resolve-from';

import { getIsolatedModulesPath } from '../autolinking/utils';
import { fileExistsAsync } from '../fileUtils';
import type { SupportedPlatform } from '../types';
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
import { resolveGradlePropertyAsync } from '../platforms/android';

const EDGE_TO_EDGE_ENABLED_GRADLE_PROPERTY_KEY = 'expo.edgeToEdgeEnabled';

/**
 * Create config for react-native core autolinking.
 */
export async function createReactNativeConfigAsync({
  platform,
  projectRoot,
  searchPaths,
  transitiveLinkingDependencies,
}: RNConfigCommandOptions): Promise<RNConfigResult> {
  const projectConfig = await loadConfigAsync<RNConfigReactNativeProjectConfig>(projectRoot);
  const dependencyRoots = {
    ...(await findDependencyRootsAsync(projectRoot, searchPaths)),
    ...findProjectLocalDependencyRoots(projectConfig),
  };

  // For Expo SDK 53 onwards, `react-native-edge-to-edge` is a transitive dependency of every expo project. Unless the user
  // has also included it as a project dependency, we have to autolink it manually (transitive non-expo module dependencies are not autolinked).
  // There are two reasons why we don't want to autolink `edge-to-edge` when `edgeToEdge` property is set to `false`:
  // 1. `react-native-is-edge-to-edge` tries to check if the `edge-to-edge` turbomodule is present to determine whether edge-to-edge is enabled.
  // 2. `react-native-edge-to-edge` applies edge-to-edge in `onHostResume` and has no property to disable this behavior.
  const shouldAutolinkEdgeToEdge =
    platform === 'android' &&
    !('react-native-edge-to-edge' in dependencyRoots) &&
    ((await resolveGradleEdgeToEdgeEnabled(projectRoot)) ||
      transitiveLinkingDependencies.includes('react-native-edge-to-edge'));

  if (shouldAutolinkEdgeToEdge) {
    const edgeToEdgeRoot = resolveEdgeToEdgeDependencyRoot(projectRoot);
    if (edgeToEdgeRoot) {
      dependencyRoots['react-native-edge-to-edge'] = edgeToEdgeRoot;
    }
  }

  // NOTE(@kitten): If this isn't resolved to be the realpath and is a symlink,
  // the Cocoapods resolution will detect path mismatches and generate nonsensical
  // relative paths that won't resolve
  let reactNativePath: string;
  try {
    reactNativePath = await fs.realpath(dependencyRoots['react-native']);
  } catch {
    reactNativePath = dependencyRoots['react-native'];
  }

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

/**
 * Find local dependencies that specified in the `react-native.config.js` file.
 */
function findProjectLocalDependencyRoots(
  projectConfig: RNConfigReactNativeProjectConfig | null
): Record<string, string> {
  if (!projectConfig?.dependencies) {
    return {};
  }
  const results: Record<string, string> = {};
  for (const [name, config] of Object.entries(projectConfig.dependencies)) {
    if (typeof config.root === 'string') {
      results[name] = config.root;
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
    ...projectConfig?.dependencies?.[name],
  };

  if (Object.keys(libraryConfig?.platforms ?? {}).length > 0) {
    // Package defines platforms would be a platform host package.
    // The rnc-cli will skip this package.
    return null;
  }
  if (name === 'react-native' || name === 'react-native-macos') {
    // Starting from version 0.76, the `react-native` package only defines platforms
    // when @react-native-community/cli-platform-android/ios is installed.
    // Therefore, we need to manually filter it out.
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

export function resolveEdgeToEdgeDependencyRoot(projectRoot: string): string | null {
  const expoPackageRoot = resolveFrom.silent(projectRoot, 'expo/package.json');
  const edgeToEdgePath = resolveFrom.silent(
    expoPackageRoot ?? projectRoot,
    'react-native-edge-to-edge/package.json'
  );
  if (edgeToEdgePath) {
    return path.dirname(edgeToEdgePath);
  }
  return null;
}

export async function resolveAppProjectConfigAsync(
  projectRoot: string,
  platform: SupportedPlatform
): Promise<RNConfigReactNativeAppProjectConfig> {
  if (platform === 'android') {
    const androidDir = path.join(projectRoot, 'android');
    const { gradle, manifest } = await findGradleAndManifestAsync({ androidDir, isLibrary: false });
    if (gradle == null || manifest == null) {
      return {};
    }
    const packageName = await parsePackageNameAsync(androidDir, manifest, gradle);

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

/**
 * Resolve the `expo.edgeToEdgeEnabled` property from the `gradle.properties` file.
 */
async function resolveGradleEdgeToEdgeEnabled(projectRoot: string): Promise<boolean> {
  return (
    (await resolveGradlePropertyAsync(
      path.join(projectRoot, 'android'),
      EDGE_TO_EDGE_ENABLED_GRADLE_PROPERTY_KEY
    )) === 'true'
  );
}
