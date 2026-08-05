import fs from 'fs';
import path from 'path';

import type { ExpoModuleConfig } from '../ExpoModuleConfig';
import { discoverExpoModuleConfigAsync } from '../ExpoModuleConfig';
import type { AutolinkingOptions } from '../commands/autolinkingOptions';
import type { DependencyResolution } from '../dependencies';
import {
  filterMapResolutionResult,
  mergeResolutionResults,
  scanDependenciesFromRNProjectConfig,
  scanDependenciesInSearchPath,
  scanDependenciesRecursively,
} from '../dependencies';
import { getSupportPackageForPlatform } from '../platforms';
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
  RNConfigDependencyWeb,
  RNConfigReactNativeAppProjectConfig,
  RNConfigReactNativeLibraryConfig,
  RNConfigReactNativeProjectConfig,
  RNConfigResult,
} from './reactNativeConfig.types';
import { checkDependencyWebAsync } from './webResolver';

const deepObjectMerge = (target: any, source: any): any => {
  if (
    source !== undefined &&
    typeof target === 'object' &&
    target != null &&
    !Array.isArray(target) &&
    (!target.constructor || target.constructor === Object) &&
    typeof source === 'object' &&
    !Array.isArray(source)
  ) {
    target = { ...target };
    for (const key in source) {
      target[key] = deepObjectMerge(target[key], source[key]);
    }
    return target;
  }
  return source !== undefined ? source : target;
};

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
  // The platform's support package is the react-native host (e.g. react-native-macos for macos,
  // react-native-tvos for tvos), not a linkable module — filter it out alongside react-native.
  // This is null for platforms without a host (web, apple), so only react-native is filtered.
  const supportPackage = getSupportPackageForPlatform(platform);
  if (excludeNames.has(resolution.name)) {
    return null;
  } else if (resolution.name === 'react-native' || resolution.name === supportPackage) {
    // Starting from version 0.76, the `react-native` package only defines platforms
    // when @react-native-community/cli-platform-android/ios is installed.
    // Therefore, we need to manually filter it (and the platform's support package) out.
    // NOTE(@kitten): `loadConfigAsync` is skipped too, because react-native's config is too slow
    return null;
  }

  // Workaround for Android Gradle/Prefab issue with special characters in paths.
  // pnpm creates virtual store paths with '=' characters (e.g., _patch_hash=abc123),
  // which cause build failures on Android due to Prefab not properly escaping them.
  // See: https://github.com/google/prefab/issues/187
  const shouldUseOriginPath =
    platform === 'android' && resolution.path.includes('=') && resolution.path.includes('.pnpm');
  const modulePath = shouldUseOriginPath ? resolution.originPath : resolution.path;

  const libraryConfig = (await loadConfigAsync(modulePath)) as RNConfigReactNativeLibraryConfig;
  if (Object.keys(libraryConfig?.platforms ?? {}).length > 0) {
    // Package defines platforms would be a platform host package.
    // The rnc-cli will skip this package.
    return null;
  }

  let reactNativeConfig = libraryConfig?.dependency ?? {};
  const projectDependencyOverride = projectConfig?.dependencies?.[resolution.name];
  if (projectDependencyOverride != null) {
    reactNativeConfig = deepObjectMerge(reactNativeConfig, projectDependencyOverride);
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

  let platformData:
    | RNConfigDependencyAndroid
    | RNConfigDependencyIos
    | RNConfigDependencyWeb
    | null = null;
  if (platform === 'android') {
    platformData = await resolveDependencyConfigImplAndroidAsync(
      modulePath,
      reactNativeConfig.platforms?.android,
      maybeExpoModuleConfig
    );
  } else if (platform === 'ios') {
    platformData = await resolveDependencyConfigImplIosAsync(
      resolution,
      reactNativeConfig.platforms?.ios,
      maybeExpoModuleConfig
    );
  } else if (platform === 'tvos' || platform === 'macos') {
    // tvos/macos build through the Apple toolchain, so they reuse the iOS autolinking resolver.
    // Use the platform-specific `react-native.config` entry when it's set — including an explicit
    // `null`, which disables autolinking for that platform — and only fall back to `platforms.ios`
    // when it's unset (`undefined`). Results are reported under the platform's own key.
    const platformConfig = reactNativeConfig.platforms?.[platform as 'tvos' | 'macos'];
    const appleConfig =
      platformConfig !== undefined ? platformConfig : reactNativeConfig.platforms?.ios;
    platformData = await resolveDependencyConfigImplIosAsync(
      resolution,
      appleConfig,
      maybeExpoModuleConfig
    );
  } else if (platform === 'web') {
    platformData = await checkDependencyWebAsync(
      resolution,
      reactNativeConfig,
      maybeExpoModuleConfig
    );
  }
  return (
    platformData && {
      root: modulePath,
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
  const projectConfig = (await loadConfigAsync(appRoot)) as RNConfigReactNativeProjectConfig;

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

  // The support package is the platform's react-native host (react-native for ios/android,
  // react-native-tvos / react-native-macos for the out-of-tree platforms). This replaces the
  // npm-alias approach where the support package was installed under the `react-native` name.
  // Native platforms always resolve a host package; fall back to react-native for safety.
  const supportPackage =
    getSupportPackageForPlatform(autolinkingOptions.platform) ?? 'react-native';

  // See: https://github.com/facebook/react-native/pull/53690
  // When we're building react-native from source without these generated files, we need to force them to be generated
  // Every published react-native version (or out-of-tree version) should have these files, but building from the raw repo won't (e.g. Expo Go)
  const reactNativeResolution = resolutions[supportPackage];
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

  const reactNativePath = resolutions[supportPackage]?.path!;
  return {
    root: appRoot,
    reactNativePath,
    dependencies,
    project: await resolveAppProjectConfigAsync(appRoot, autolinkingOptions.platform, sourceDir),
  };
}

function resolveAppleProjectSourceDir(projectRoot: string, platform: string): string {
  const platformDir = path.join(projectRoot, platform);
  if (fs.existsSync(path.join(platformDir, 'Podfile'))) {
    return platformDir;
  }
  return path.join(projectRoot, 'ios');
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
    const packageName = await parsePackageNameAsync(manifest, gradle);

    return {
      android: {
        packageName: packageName ?? '',
        sourceDir: sourceDir ?? path.join(projectRoot, 'android'),
      },
    };
  }

  if (platform === 'ios' || platform === 'tvos' || platform === 'macos') {
    // tvos/macos may reuse the iOS (Apple) toolchain but are reported under their own platform key
    return {
      [platform]: {
        sourceDir: sourceDir ?? resolveAppleProjectSourceDir(projectRoot, platform),
      },
    };
  }

  return {};
}
