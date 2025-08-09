import type { ResolutionContext } from '@expo/metro/metro-resolver';
import type { ResolutionResult as AutolinkingResolutionResult } from 'expo-modules-autolinking/exports';

import type { StrictResolverFactory } from './withMetroMultiPlatform';
import type { ExpoCustomMetroResolver } from './withMetroResolvers';

const debug = require('debug')('expo:start:server:metro:sticky-resolver') as typeof console.log;

// This is a list of known modules we want to always include in sticky resolution
// Specifying these skips platform- and module-specific checks and always includes them in the output
const KNOWN_STICKY_DEPENDENCIES = [
  // NOTE: react and react-dom aren't native modules, but must also be deduplicated in bundles
  'react',
  'react-dom',
  // NOTE: react-native won't be in autolinking output, since it's special
  // We include it here manually, since we know it should be an unduplicated direct dependency
  'react-native',
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
];

const AUTOLINKING_PLATFORMS = ['android', 'ios'] as const;
type AutolinkingPlatform = (typeof AUTOLINKING_PLATFORMS)[number];

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
}

const toPlatformModuleDescription = (
  dependencies: AutolinkingResolutionResult,
  platform: AutolinkingPlatform
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
  debug(
    `Sticky resolution for ${platform} registered ${resolvedModuleNames.length} resolutions:`,
    resolvedModuleNames
  );
  return {
    platform,
    moduleTestRe: _dependenciesToRegex(resolvedModuleNames),
    resolvedModulePaths,
  };
};

export type StickyModuleResolverInput = {
  [platform in AutolinkingPlatform]?: PlatformModuleDescription;
};

export async function createStickyModuleResolverInput({
  platforms,
  projectRoot,
}: {
  projectRoot: string;
  platforms: string[];
}): Promise<StickyModuleResolverInput> {
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
          const moduleDescription = toPlatformModuleDescription(dependencies, platform);
          return [platform, moduleDescription] satisfies [
            AutolinkingPlatform,
            PlatformModuleDescription,
          ];
        })
    )
  ) as StickyModuleResolverInput;
}

export function createStickyModuleResolver(
  input: StickyModuleResolverInput | undefined,
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
      const resolvedModulePath =
        moduleDescription.resolvedModulePaths[moduleMatch[1]] || moduleName;
      // We instead resolve as if it was a dependency from within the module (self-require/import)
      const context: ResolutionContext = {
        ...immutableContext,
        nodeModulesPaths: [resolvedModulePath],
        originModulePath: resolvedModulePath,
      };
      const res = getStrictResolver(context, platform)(moduleName);
      debug(`Sticky resolution for ${platform}: ${moduleName} -> from: ${resolvedModulePath}`);
      return res;
    }

    return null;
  };
}
