import type { Platform } from '@expo/config';
import { getConfig, getPlatformsFromConfig } from '@expo/config';

import type { PlatformBundlers } from '../start/server/platformBundlers';
import { getPlatformBundlers } from '../start/server/platformBundlers';
import { CommandError } from '../utils/errors';

export type Options = {
  outputDir: string;
  platforms: Platform[];
  maxWorkers?: number;
  dev: boolean;
  clear: boolean;
  minify: boolean;
  bytecode: boolean;
  dumpAssetmap: boolean;
  sourceMaps: boolean;
  inlineSourceMaps: boolean;
  skipSSG: boolean;
  hostedNative: boolean;
  /** Bundler override for production export, e.g. `expo export --bundler rollipop`. */
  bundler?: 'metro' | 'rollipop';
};

/** Returns an array of platforms based on the input platform identifier and runtime constraints. */
export function resolvePlatformOption(
  configPlatforms: Platform[],
  platformBundlers: PlatformBundlers,
  platform: string[] = ['all']
): Platform[] {
  // A platform is exportable when it is configured in the project's `platforms`
  // and its bundler is one of the supported *native* bundlers (Metro or
  // Rollipop). Rollipop is a drop-in Metro replacement for native (ios/android)
  // production exports, so it must be eligible here — otherwise
  // `expo export --bundler rollipop` (or `ios.bundler: 'rollipop'` in
  // app.json) could never select `ios`/`android`. We keep `webpack` web-only
  // and exclude Xcode-built `tvos`/`macos` from the dev-server/export path.
  const isExportableBundler = (bundler: string): boolean =>
    bundler === 'metro' || bundler === 'rollipop';

  const platformsAvailable: Partial<PlatformBundlers> = Object.fromEntries(
    Object.entries(platformBundlers).filter(
      ([platform, bundler]) =>
        isExportableBundler(bundler) && configPlatforms.includes(platform as Platform)
    )
  );

  if (!Object.keys(platformsAvailable).length) {
    throw new CommandError(
      `No platforms are configured to use the Metro or Rollipop bundler in the project Expo config.`
    );
  }

  const assertPlatformBundler = (platform: Platform): Platform => {
    if (!platformsAvailable[platform]) {
      if (!configPlatforms.includes(platform) && platform === 'web') {
        // Pass through so the more robust error message is shown.
        return platform;
      }
      throw new CommandError(
        'BAD_ARGS',
        `Platform "${platform}" is not configured to use the Metro or Rollipop bundler in the project Expo config, or is missing from the supported platforms in the platforms array: [${configPlatforms.join(
          ', '
        )}].`
      );
    }

    return platform;
  };

  const knownPlatforms = ['android', 'ios', 'web', 'tvos', 'macos'] as Platform[];
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

  const platformsFromConfig = getPlatformsFromConfig(projectRoot, exp);
  const platforms = resolvePlatformOption(
    platformsFromConfig,
    platformBundlers,
    args['--platform']
  );

  // --source-maps can be true, "external", or "inline"
  const sourceMapsArg = args['--source-maps'];
  const sourceMaps = !!sourceMapsArg;
  const inlineSourceMaps = sourceMapsArg === 'inline';

  return {
    platforms,
    hostedNative: !!args['--unstable-hosted-native'],
    bundler: (args['--bundler'] as 'metro' | 'rollipop' | undefined) ?? undefined,
    outputDir: args['--output-dir'] ?? 'dist',
    minify: !args['--no-minify'],
    bytecode: !args['--no-bytecode'],
    clear: !!args['--clear'],
    dev: !!args['--dev'],
    maxWorkers: args['--max-workers'],
    dumpAssetmap: !!args['--dump-assetmap'],
    sourceMaps,
    inlineSourceMaps,
    skipSSG: !!args['--no-ssg'] || !!args['--api-only'],
  };
}
