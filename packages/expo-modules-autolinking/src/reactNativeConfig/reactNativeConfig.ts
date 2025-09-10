import fs from 'fs';
import path from 'path';

import type { SupportedPlatform } from '../types';
import {
  findGradleAndManifestAsync,
  parsePackageNameAsync,
  resolveDependencyConfigImplAndroidAsync,
} from './androidResolver';
import { loadConfigAsync } from './config';
import { resolveDependencyConfigImplIosAsync } from './iosResolver';
import type {
  RNConfigDependency,
  RNConfigDependencyAndroid,
  RNConfigDependencyIos,
  RNConfigReactNativeAppProjectConfig,
  RNConfigReactNativeLibraryConfig,
  RNConfigReactNativeProjectConfig,
  RNConfigResult,
} from './reactNativeConfig.types';
import { discoverExpoModuleConfigAsync, ExpoModuleConfig } from '../ExpoModuleConfig';
import { AutolinkingOptions } from '../commands/autolinkingOptions';
import {
  DependencyResolution,
  filterMapResolutionResult,
  mergeResolutionResults,
  scanDependenciesFromRNProjectConfig,
  scanDependenciesInSearchPath,
  scanDependenciesRecursively,
} from '../dependencies';

const isMissingFBReactNativeSpecCodegenOutput = async (reactNativePath: string) => {
  const generatedDir = path.resolve(reactNativePath, 'React/FBReactNativeSpec');
  try {
    const stat = await fs.promises.lstat(generatedDir);
    return !stat.isDirectory();
  } catch {
    return true;
  }
};

export async function resolveReactNativeModule(
  resolution: DependencyResolution,
  projectConfig: RNConfigReactNativeProjectConfig | null,
  platform: SupportedPlatform,
  excludeNames: Set<string>
): Promise<RNConfigDependency | null> {
  if (excludeNames.has(resolution.name)) {
    return null;
  }

  const libraryConfig = await loadConfigAsync<RNConfigReactNativeLibraryConfig>(resolution.path);
  const reactNativeConfig = {
    ...libraryConfig?.dependency,
    ...projectConfig?.dependencies?.[resolution.name],
  };

  if (Object.keys(libraryConfig?.platforms ?? {}).length > 0) {
    // Package defines platforms would be a platform host package.
    // The rnc-cli will skip this package.
    return null;
  } else if (resolution.name === 'react-native' || resolution.name === 'react-native-macos') {
    // Starting from version 0.76, the `react-native` package only defines platforms
    // when @react-native-community/cli-platform-android/ios is installed.
    // Therefore, we need to manually filter it out.
    return null;
  }

  let maybeExpoModuleConfig: ExpoModuleConfig | null | undefined;
  if (!libraryConfig) {
    // NOTE(@kitten): If we don't have an explicit react-native.config.{js,ts} file,
    // we should pass the Expo Module config (if it exists) to the resolvers below,
    // which can then decide if the React Native inferred config and Expo Module
    // configs conflict
    try {
      maybeExpoModuleConfig = await discoverExpoModuleConfigAsync(resolution.path);
    } catch {
      // We ignore invalid Expo Modules for the purpose of auto-linking and
      // pretend the config doesn't exist, if it isn't valid JSON
    }
  }

  let platformData: RNConfigDependencyAndroid | RNConfigDependencyIos | null = null;
  if (platform === 'android') {
    platformData = await resolveDependencyConfigImplAndroidAsync(
      resolution.path,
      reactNativeConfig.platforms?.android,
      maybeExpoModuleConfig
    );
  } else if (platform === 'ios') {
    platformData = await resolveDependencyConfigImplIosAsync(
      resolution,
      reactNativeConfig.platforms?.ios,
      maybeExpoModuleConfig
    );
  }
  return (
    platformData && {
      root: resolution.path,
      name: resolution.name,
      platforms: {
        [platform]: platformData,
      },
    }
  );
}

interface CreateRNConfigParams {
  appRoot: string;
  sourceDir: string | undefined;
  autolinkingOptions: AutolinkingOptions & { platform: SupportedPlatform };
}

/**
 * Create config for react-native core autolinking.
 */
export async function createReactNativeConfigAsync({
  appRoot,
  sourceDir,
  autolinkingOptions,
}: CreateRNConfigParams): Promise<RNConfigResult> {
  const excludeNames = new Set(autolinkingOptions.exclude);
  const projectConfig = await loadConfigAsync<RNConfigReactNativeProjectConfig>(appRoot);

  // custom native modules should be resolved first so that they can override other modules
  const searchPaths = autolinkingOptions.nativeModulesDir
    ? [autolinkingOptions.nativeModulesDir, ...autolinkingOptions.searchPaths]
    : autolinkingOptions.searchPaths;

  const limitDepth = autolinkingOptions.legacy_shallowReactNativeLinking ? 1 : undefined;

  const resolutions = mergeResolutionResults(
    await Promise.all([
      scanDependenciesFromRNProjectConfig(appRoot, projectConfig),
      ...searchPaths.map((searchPath) => scanDependenciesInSearchPath(searchPath)),
      scanDependenciesRecursively(appRoot, { limitDepth }),
    ])
  );

  const dependencies = await filterMapResolutionResult(resolutions, (resolution) =>
    resolveReactNativeModule(resolution, projectConfig, autolinkingOptions.platform, excludeNames)
  );

  // See: https://github.com/facebook/react-native/pull/53690
  // When we're building react-native from source without these generated files, we need to force them to be generated
  // Every published react-native version (or out-of-tree version) should have these files, but building from the raw repo won't (e.g. Expo Go)
  const reactNativeResolution = resolutions['react-native'];
  if (
    reactNativeResolution &&
    autolinkingOptions.platform === 'ios' &&
    (await isMissingFBReactNativeSpecCodegenOutput(reactNativeResolution.path))
  ) {
    dependencies['react-native'] = {
      root: reactNativeResolution.path,
      name: 'react-native',
      platforms: {
        ios: {
          // This will trigger a warning in list_native_modules but will trigger the artifacts
          // codegen codepath as expected
          podspecPath: '',
          version: reactNativeResolution.version,
          configurations: [],
          scriptPhases: [],
        },
      },
    };
  }

  return {
    root: appRoot,
    reactNativePath: resolutions['react-native']?.path!,
    dependencies,
    project: await resolveAppProjectConfigAsync(appRoot, autolinkingOptions.platform, sourceDir),
  };
}

export async function resolveAppProjectConfigAsync(
  projectRoot: string,
  platform: SupportedPlatform,
  sourceDir?: string
): Promise<RNConfigReactNativeAppProjectConfig> {
  // TODO(@kitten): use the commandRoot here to find these files in non <projectRoot>/<platform> folders
  if (platform === 'android') {
    const androidDir = sourceDir ?? path.join(projectRoot, 'android');
    const { gradle, manifest } = await findGradleAndManifestAsync({ androidDir, isLibrary: false });
    if (gradle == null || manifest == null) {
      return {};
    }
    const packageName = await parsePackageNameAsync(androidDir, manifest, gradle);

    return {
      android: {
        packageName: packageName ?? '',
        sourceDir: sourceDir ?? path.join(projectRoot, 'android'),
      },
    };
  }

  if (platform === 'ios') {
    return {
      ios: {
        sourceDir: sourceDir ?? path.join(projectRoot, 'ios'),
      },
    };
  }

  return {};
}
