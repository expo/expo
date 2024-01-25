import { ExpoConfig, getConfig, Platform } from '@expo/config';

import { getPlatformBundlers, PlatformBundlers } from '../start/server/platformBundlers';
import { CommandError } from '../utils/errors';

export type Options = {
  outputDir: string;
  platforms: Platform[];
  maxWorkers?: number;
  dev: boolean;
  clear: boolean;
  minify: boolean;
  dumpAssetmap: boolean;
  sourceMaps: boolean;
  stats?: boolean;
};

/** Returns an array of platforms based on the input platform identifier and runtime constraints. */
export function resolvePlatformOption(
  exp: ExpoConfig,
  platformBundlers: PlatformBundlers,
  platform: string[] = ['all']
): Platform[] {
  const platformsAvailable: Partial<PlatformBundlers> = Object.fromEntries(
    Object.entries(platformBundlers).filter(
      ([platform, bundler]) => bundler === 'metro' && exp.platforms?.includes(platform as Platform)
    )
  );

  if (!Object.keys(platformsAvailable).length) {
    throw new CommandError(
      `No platforms are configured to use the Metro bundler in the project Expo config.`
    );
  }

  const assertPlatformBundler = (platform: Platform): Platform => {
    if (!platformsAvailable[platform]) {
      throw new CommandError(
        'BAD_ARGS',
        `Platform "${platform}" is not configured to use the Metro bundler in the project Expo config.`
      );
    }

    return platform;
  };

  const knownPlatforms = ['android', 'ios', 'web'] as Platform[];
  const assertPlatformIsKnown = (platform: string): Platform => {
    if (!knownPlatforms.includes(platform as Platform)) {
      throw new CommandError(
        `Unsupported platform "${platform}". Options are: ${knownPlatforms.join(',')},all`
      );
    }

    return platform as Platform;
  };

  return (
    platform
      // Expand `all` to all available platforms.
      .map((platform) => (platform === 'all' ? Object.keys(platformsAvailable) : platform))
      .flat()
      // Remove duplicated platforms
      .filter((platform, index, list) => list.indexOf(platform) === index)
      // Assert platforms are valid
      .map((platform) => assertPlatformIsKnown(platform))
      .map((platform) => assertPlatformBundler(platform))
  );
}

export async function resolveOptionsAsync(projectRoot: string, args: any): Promise<Options> {
  const { exp } = getConfig(projectRoot, { skipPlugins: true, skipSDKVersionRequirement: true });
  const platformBundlers = getPlatformBundlers(projectRoot, exp);

  return {
    platforms: resolvePlatformOption(exp, platformBundlers, args['--platform']),
    outputDir: args['--output-dir'] ?? 'dist',
    minify: !args['--no-minify'],
    clear: !!args['--clear'],
    dev: !!args['--dev'],
    maxWorkers: args['--max-workers'],
    dumpAssetmap: !!args['--dump-assetmap'],
    sourceMaps: !!args['--source-maps'],
    stats: !!args['--stats'],
  };
}
