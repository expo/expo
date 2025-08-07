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
  RNConfigCommandOptions,
  RNConfigDependency,
  RNConfigDependencyAndroid,
  RNConfigDependencyIos,
  RNConfigReactNativeAppProjectConfig,
  RNConfigReactNativeLibraryConfig,
  RNConfigReactNativeProjectConfig,
  RNConfigResult,
} from './reactNativeConfig.types';
import { mergeLinkingOptionsAsync } from '../autolinking';
import {
  DependencyResolution,
  filterMapResolutionResult,
  mergeResolutionResults,
  scanDependenciesFromRNProjectConfig,
  scanDependenciesInSearchPath,
  scanDependenciesRecursively,
} from '../dependencies';

export async function _resolveReactNativeModule(
  resolution: DependencyResolution,
  projectConfig: RNConfigReactNativeProjectConfig | null,
  platform: SupportedPlatform
): Promise<RNConfigDependency | null> {
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

  let platformData: RNConfigDependencyAndroid | RNConfigDependencyIos | null = null;
  if (platform === 'android') {
    platformData = await resolveDependencyConfigImplAndroidAsync(
      resolution.path,
      reactNativeConfig.platforms?.android
    );
  } else if (platform === 'ios') {
    platformData = await resolveDependencyConfigImplIosAsync(
      resolution,
      reactNativeConfig.platforms?.ios
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

/**
 * Create config for react-native core autolinking.
 */
export async function createReactNativeConfigAsync(
  providedOptions: RNConfigCommandOptions
): Promise<RNConfigResult> {
  const options = await mergeLinkingOptionsAsync(providedOptions);
  const projectConfig = await loadConfigAsync<RNConfigReactNativeProjectConfig>(
    options.projectRoot
  );

  // custom native modules should be resolved first so that they can override other modules
  const searchPaths =
    options.nativeModulesDir && fs.existsSync(options.nativeModulesDir)
      ? [options.nativeModulesDir, ...(options.searchPaths ?? [])]
      : (options.searchPaths ?? []);

  const resolutions = mergeResolutionResults(
    await Promise.all([
      scanDependenciesFromRNProjectConfig(options.projectRoot, projectConfig),
      ...searchPaths.map((searchPath) => scanDependenciesInSearchPath(searchPath)),
      scanDependenciesRecursively(options.projectRoot),
    ])
  );

  const dependencies = await filterMapResolutionResult(resolutions, (resolution) =>
    _resolveReactNativeModule(resolution, projectConfig, options.platform)
  );

  return {
    root: options.projectRoot,
    reactNativePath: resolutions['react-native']?.path!,
    dependencies,
    project: await resolveAppProjectConfigAsync(
      options.projectRoot,
      options.platform,
      options.sourceDir
    ),
  };
}

export async function resolveAppProjectConfigAsync(
  projectRoot: string,
  platform: SupportedPlatform,
  sourceDir?: string
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
