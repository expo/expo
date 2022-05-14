import { Platform } from '@expo/config';

import { CommandError } from '../utils/errors';

export type Options = {
  outputDir: string;
  platforms: Platform[];
  maxWorkers?: number;
  dev: boolean;
  clear: boolean;
  dumpAssetmap: boolean;
  dumpSourcemap: boolean;
};

/** Returns an array of platforms based on the input platform identifier and runtime constraints. */
export function resolvePlatformOption(
  platform: string = 'all',
  { loose }: { loose?: boolean } = {}
): Platform[] {
  switch (platform) {
    case 'ios':
      return ['ios'];
    case 'web':
      return ['web'];
    case 'android':
      return ['android'];
    case 'all': {
      const platforms: Platform[] = ['android', 'web'];
      if (loose || process.platform !== 'win32') {
        platforms.push('ios');
      }
      return platforms;
    }
    default:
      throw new CommandError(
        `Unsupported platform "${platform}". Options are: ios, android, web, all`
      );
  }
}

export async function resolveOptionsAsync(args: any): Promise<Options> {
  const platforms: Platform[] = resolvePlatformOption(args['--platform'] ?? 'all', {
    loose: true,
  });

  return {
    outputDir: args['--output-dir'] ?? 'dist',
    platforms,
    clear: !!args['--clear'],
    dev: !!args['--dev'],
    maxWorkers: args['--max-workers'],
    dumpAssetmap: !!args['--dump-assetmap'],
    dumpSourcemap: !!args['--dump-sourcemap'],
  };
}
