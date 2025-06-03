import type { StrictResolverFactory } from './withMetroMultiPlatform';
import type { ExpoCustomMetroResolver } from './withMetroResolvers';

const debug = require('debug')('expo:start:server:metro:sticky-resolver') as typeof console.log;

// TODO(@kitten): Set to all supported platforms then filter by `config.resolver.platforms`
const AUTOLINKING_PLATFORMS = ['android', 'ios', 'web'] as const;
type AutolinkingPlatform = (typeof AUTOLINKING_PLATFORMS)[number];

/** Converts a list of module names to a regex that may either match bare module names or sub-modules of modules */
const dependenciesToRegex = (dependencies: string[]) =>
  new RegExp(`^(${dependencies.join('|')})($|/.*)`);

const getAutolinkingModule = (): typeof import('expo-modules-autolinking/exports') => {
  const expoPath = require.resolve('expo/package.json');
  const autolinkingPath = require.resolve('expo-modules-autolinking/exports', {
    paths: [expoPath],
  });
  return require(autolinkingPath);
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
  const autolinking = getAutolinkingModule();
  const resolvedModules = await autolinking.findModulesAsync(
    await autolinking.mergeLinkingOptionsAsync({
      searchPaths: [],
      projectRoot,
      platform,
      onlyProjectDeps: true,
      silent: true,
    })
  );
  return {
    platform,
    moduleTestRe: dependenciesToRegex(Object.keys(resolvedModules)),
    resolvedModulePaths: Object.fromEntries(
      Object.entries(resolvedModules).map(([key, entry]) => [key, entry.path])
    ),
  };
};

export type StickyModuleResolverInput = {
  [platform in AutolinkingPlatform]: PlatformModuleDescription;
} & {
  [unknownPlatform: string]: never;
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
  input: StickyModuleResolverInput,
  getStrictResolver: StrictResolverFactory
): ExpoCustomMetroResolver {
  const fileSpecifierRe = /^[\\/]|^\.\.?(?:$|[\\/])/i;
  const isAutolinkingPlatform = (platform: string | null): platform is AutolinkingPlatform =>
    !!platform && !!input[platform];

  return function requestStickyModule(context, moduleName, platform) {
    if (!isAutolinkingPlatform(platform)) {
      return null;
    } else if (fileSpecifierRe.test(moduleName)) {
      return null;
    }

    const moduleDescription = input[platform];
    const moduleMatch = moduleDescription.moduleTestRe.exec(moduleName);
    if (moduleMatch) {
      const resolvedModulePath =
        moduleDescription.resolvedModulePaths[moduleMatch[1]] || moduleName;
      const resolvedModuleRequest = resolvedModulePath + (moduleMatch[2] || '');
      const res = getStrictResolver(context, platform)(resolvedModuleRequest);
      debug(`Sticky resolution for ${platform}: ${moduleName} -> ${resolvedModuleRequest}`);
      return res;
    }

    return null;
  };
}
