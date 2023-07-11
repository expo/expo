import { getConfig, Platform } from '@expo/config';

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
  dumpSourcemap: boolean;
};

/** Returns an array of platforms based on the input platform identifier and runtime constraints. */
export function resolvePlatformOption(
  platformBundlers: PlatformBundlers,
  platform: string = 'all'
): Platform[] {
  const platforms: Partial<PlatformBundlers> = Object.fromEntries(
    Object.entries(platformBundlers).filter(([, bundler]) => bundler === 'metro')
  );

  if (!Object.keys(platforms).length) {
    throw new CommandError(
      `No platforms are configured to use the Metro bundler in the project Expo config.`
    );
  }

  const assertPlatformBundler = (platform: Platform) => {
    if (!platforms[platform]) {
      throw new CommandError(
        'BAD_ARGS',
        `Platform "${platform}" is not configured to use the Metro bundler in the project Expo config.`
      );
    }
  };

  switch (platform) {
    case 'ios':
      assertPlatformBundler('ios');
      return ['ios'];
    case 'web':
      assertPlatformBundler('web');
      return ['web'];
    case 'android':
      assertPlatformBundler('android');
      return ['android'];
    case 'all':
      return Object.keys(platforms) as Platform[];
    default:
      throw new CommandError(
        `Unsupported platform "${platform}". Options are: ${Object.keys(platforms).join(',')}, all`
      );
  }
}

export async function resolveOptionsAsync(projectRoot: string, args: any): Promise<Options> {
  const { exp } = getConfig(projectRoot, { skipPlugins: true, skipSDKVersionRequirement: true });
  const platformBundlers = getPlatformBundlers(exp);
  const platforms: Platform[] = resolvePlatformOption(
    platformBundlers,
    args['--platform'] ?? 'all'
  );

  return {
    outputDir: args['--output-dir'] ?? 'dist',
    platforms,
    minify: !args['--no-minify'],
    clear: !!args['--clear'],
    dev: !!args['--dev'],
    maxWorkers: args['--max-workers'],
    dumpAssetmap: !!args['--dump-assetmap'],
    dumpSourcemap: !!args['--dump-sourcemap'],
  };
}
