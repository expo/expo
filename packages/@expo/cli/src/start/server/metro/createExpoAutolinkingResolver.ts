import type { Platform } from '@expo/config';
import type { ResolutionContext } from '@expo/metro/metro-resolver';
import type { ResolutionResult as AutolinkingResolutionResult } from 'expo-modules-autolinking/exports';

import type { StrictResolverFactory } from './withMetroMultiPlatform';
import type { ExpoCustomMetroResolver } from './withMetroResolvers';

const debug = require('debug')(
  'expo:start:server:metro:autolinking-resolver'
) as typeof console.log;

// This is a list of known modules we want to always include in sticky resolution
// Specifying these skips platform- and module-specific checks and always includes them in the output
const KNOWN_STICKY_DEPENDENCIES = [
  // NOTE: react and react-dom aren't native modules, but must also be deduplicated in bundles
  'react',
  'react-dom',
  // NOTE: react-native won't be in autolinking output, since it's special
  // We include it here manually, since we know it should be an unduplicated direct dependency
  'react-native',
  // NOTE: We may redirect dependencies from react-native to react-native-web. This fails if
  // a sub-dependency cannot access react-native-web, so we define it here
  'react-native-web',
  // Peer dependencies from expo
  'react-native-webview',
  '@expo/dom-webview',
  // Dependencies from expo
  'expo-asset',
  'expo-constants',
  'expo-file-system',
  'expo-font',
  'expo-keep-awake',
  'expo-modules-core',
  // Peer dependencies from expo-router
  'react-native-gesture-handler',
  'react-native-reanimated',
  // Has a context that needs to be deduplicated
  '@react-navigation/core',
  '@react-navigation/native',
];

const AUTOLINKING_PLATFORMS: readonly Platform[] = ['android', 'ios', 'web', 'tvos', 'macos'];

export type AutolinkingPlatform = Platform;

const escapeDependencyName = (dependency: string) =>
  dependency.replace(/[*.?()[\]]/g, (x) => `\\${x}`);

/** Converts a list of module names to a regex that may either match bare module names or sub-modules of modules */
export const _dependenciesToRegex = (dependencies: string[]) =>
  new RegExp(`^(${dependencies.map(escapeDependencyName).join('|')})($|/.*)`);

const getAutolinkingExports = (): typeof import('expo/internal/unstable-autolinking-exports') =>
  require('expo/internal/unstable-autolinking-exports');

interface PlatformModuleDescription {
  platform: AutolinkingPlatform;
  moduleTestRe: RegExp;
  resolvedModulePaths: Record<string, string>;
  moduleNameRewrites: Record<string, string | undefined>;
}

const toPlatformModuleDescription = (
  dependencies: AutolinkingResolutionResult,
  platform: AutolinkingPlatform,
  supportPackage: string | null
): PlatformModuleDescription => {
  const resolvedModulePaths: Record<string, string> = {};
  const resolvedModuleNames: string[] = [];
  for (const dependencyName in dependencies) {
    const dependency = dependencies[dependencyName];
    if (dependency) {
      resolvedModuleNames.push(dependency.name);
      resolvedModulePaths[dependency.name] = dependency.path;
    }
  }
  // Redirect `react-native` to the platform's support package
  const moduleNameRewrites: Record<string, string | undefined> = {};
  if (supportPackage && supportPackage !== 'react-native' && resolvedModulePaths[supportPackage]) {
    moduleNameRewrites['react-native'] = supportPackage;
  }
  debug(
    `Sticky resolution for ${platform} registered ${resolvedModuleNames.length} resolutions:`,
    resolvedModuleNames
  );
  return {
    platform,
    moduleTestRe: _dependenciesToRegex(resolvedModuleNames),
    resolvedModulePaths,
    moduleNameRewrites,
  };
};

export type AutolinkingModuleResolverInput = {
  [platform in AutolinkingPlatform]?: PlatformModuleDescription;
};

export async function createAutolinkingModuleResolverInput({
  platforms,
  projectRoot,
}: {
  projectRoot: string;
  platforms: string[];
}): Promise<AutolinkingModuleResolverInput> {
  const autolinking = getAutolinkingExports();
  const linker = autolinking.makeCachedDependenciesLinker({ projectRoot });

  return Object.fromEntries(
    await Promise.all(
      platforms
        .filter((platform): platform is AutolinkingPlatform => {
          return AUTOLINKING_PLATFORMS.includes(platform as any);
        })
        .map(async (platform) => {
          const dependencies = await autolinking.scanDependencyResolutionsForPlatform(
            linker,
            platform,
            KNOWN_STICKY_DEPENDENCIES
          );
          const supportPackage = autolinking.getSupportPackageForPlatform(platform);
          const moduleDescription = toPlatformModuleDescription(
            dependencies,
            platform,
            supportPackage
          );
          return [platform, moduleDescription] satisfies [
            AutolinkingPlatform,
            PlatformModuleDescription,
          ];
        })
    )
  ) as AutolinkingModuleResolverInput;
}

export function createAutolinkingModuleResolver(
  input: AutolinkingModuleResolverInput | undefined,
  { getStrictResolver }: { getStrictResolver: StrictResolverFactory }
): ExpoCustomMetroResolver | undefined {
  if (!input) {
    return undefined;
  }

  const fileSpecifierRe = /^[\\/]|^\.\.?(?:$|[\\/])/i;
  const isAutolinkingPlatform = (platform: string | null): platform is AutolinkingPlatform =>
    !!platform && (input as any)[platform] != null;

  return function requestStickyModule(immutableContext, moduleName, platform) {
    // NOTE(@kitten): We currently don't include Web. The `expo-doctor` check already warns
    // about duplicates, and we can try to add Web later on. We should expand expo-modules-autolinking
    // properly to support web first however
    if (!isAutolinkingPlatform(platform)) {
      return null;
    } else if (fileSpecifierRe.test(moduleName)) {
      return null;
    }

    const moduleDescription = input[platform]!;
    const moduleMatch = moduleDescription.moduleTestRe.exec(moduleName);
    if (moduleMatch) {
      const matchedName = moduleMatch[1]!;
      const rewriteTarget = moduleDescription.moduleNameRewrites?.[matchedName];
      const resolvedModuleName =
        rewriteTarget != null ? rewriteTarget + moduleMatch[2]! : moduleName;
      const resolvedModulePath =
        moduleDescription.resolvedModulePaths[rewriteTarget ?? matchedName] || resolvedModuleName;
      // We instead resolve as if it was a dependency from within the (target) module
      const context: ResolutionContext = {
        ...immutableContext,
        nodeModulesPaths: [],
        originModulePath: resolvedModulePath,
      };
      const res = getStrictResolver(context, platform)(resolvedModuleName);
      debug(
        `Sticky resolution for ${platform}: ${moduleName} -> ${resolvedModuleName} (from: ${resolvedModulePath})`
      );
      return res;
    }

    return null;
  };
}
