import { Platform } from '@expo/config';

import { resolvePlatformOption } from '../prebuild/resolveOptions';

export type Options = {
  outputDir: string;
  platforms: Platform[];
  maxWorkers?: number;
  dev: boolean;
  clear: boolean;
  dumpAssetmap: boolean;
  dumpSourcemap: boolean;
};

export async function resolveOptionsAsync(args: any): Promise<Options> {
  const platforms: Platform[] = ['web']; // resolvePlatformOption(args['--platform'] ?? 'all', { loose: true });

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
