import type { ResolutionContext } from '@expo/metro/metro-resolver';
import type { SearchOptions as AutolinkingSearchOptions } from 'expo-modules-autolinking/exports';

import type { StrictResolverFactory } from './withMetroMultiPlatform';
import type { ExpoCustomMetroResolver } from './withMetroResolvers';

const debug = require('debug')('expo:start:server:metro:sticky-resolver') as typeof console.log;

const AUTOLINKING_PLATFORMS = ['android', 'ios', 'web'] as const;
type AutolinkingPlatform = (typeof AUTOLINKING_PLATFORMS)[number];

const escapeDependencyName = (dependency: string) =>
  dependency.replace(/[*.?()[\]]/g, (x) => `\\${x}`);

/** Converts a list of module names to a regex that may either match bare module names or sub-modules of modules */
export const _dependenciesToRegex = (dependencies: string[]) =>
  new RegExp(`^(${dependencies.map(escapeDependencyName).join('|')})($|/.*)`);

/** Creates a function to load a dependency of the `expo` package */
const createExpoDependencyLoader = <T>(request: string) => {
  let mod: T | undefined;
  return (): T => {
    if (!mod) {
      const expoPath = require.resolve('expo/package.json');
      const autolinkingPath = require.resolve(request, {
        paths: [expoPath],
      });
      return (mod = require(autolinkingPath));
    }
    return mod;
  };
};

const getAutolinkingModule = createExpoDependencyLoader<
  typeof import('expo-modules-autolinking/exports')
>('expo-modules-autolinking/exports');

const getReactNativeConfigModule = createExpoDependencyLoader<
  typeof import('expo-modules-autolinking/build/reactNativeConfig')
>('expo-modules-autolinking/build/reactNativeConfig');

const getAutolinkingOptions = async (
  projectRoot: string,
  platform: AutolinkingPlatform
): Promise<AutolinkingSearchOptions> => {
  const autolinking = getAutolinkingModule();
  return await autolinking.mergeLinkingOptionsAsync({
    searchPaths: [],
    projectRoot,
    platform: platform === 'ios' ? 'apple' : platform,
    onlyProjectDeps: true,
    silent: true,
  });
};

const getAutolinkingResolutions = async (
  opts: AutolinkingSearchOptions
): Promise<Record<string, string>> => {
  const autolinking = getAutolinkingModule();
  const resolvedModules = await autolinking.findModulesAsync(opts);
  return Object.fromEntries(
    Object.entries(resolvedModules).map(([key, entry]) => [key, entry.path])
  );
};

const getReactNativeConfigResolutions = async (
  opts: AutolinkingSearchOptions
): Promise<Record<string, string>> => {
  const reactNativeConfigModule = getReactNativeConfigModule();
  const configResult = await reactNativeConfigModule.createReactNativeConfigAsync({
    ...opts,
    // NOTE(@kitten): web will use ios here. This is desired since this function only accepts android|ios.
    // However, we'd still like to sticky resolve dependencies for web
    platform: opts.platform === 'android' ? 'android' : 'ios',
    // TODO(@kitten): Unclear if this should be populated or directly relates to sticky resolution
    transitiveLinkingDependencies: [],
  });
  return Object.fromEntries(
    Object.entries(configResult.dependencies).map(([key, entry]) => [key, entry.root])
  );
};

interface PlatformModuleDescription {
  platform: AutolinkingPlatform;
  moduleTestRe: RegExp;
  resolvedModulePaths: Record<string, string>;
}

const getPlatformModuleDescription = async (
  projectRoot: string,
  platform: AutolinkingPlatform
): Promise<PlatformModuleDescription> => {
  const searchOptions = await getAutolinkingOptions(projectRoot, platform);
  const autolinkingResolutions$ = getAutolinkingResolutions(searchOptions);
  const reactNativeConfigResolutions$ = getReactNativeConfigResolutions(searchOptions);
  const resolvedModulePaths = {
    ...(await reactNativeConfigResolutions$),
    ...(await autolinkingResolutions$),
  };
  const resolvedModuleNames = Object.keys(resolvedModulePaths);
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
  return Object.fromEntries(
    await Promise.all(
      platforms
        .filter((platform): platform is AutolinkingPlatform =>
          AUTOLINKING_PLATFORMS.includes(platform as any)
        )
        .map(async (platform) => {
          const platformModuleDescription = await getPlatformModuleDescription(
            projectRoot,
            platform
          );
          return [platformModuleDescription.platform, platformModuleDescription] as const;
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
      debug(`Sticky resolution for ${platform}: ${moduleName} -> ${resolvedModulePath}`);
      return res;
    }

    return null;
  };
}
