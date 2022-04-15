import assert from 'assert';

export type Options = {
  outputDir: string;
  platform: 'all' | 'ios' | 'android';
  mergeSrcUrl: string[];
  mergeSrcDir: string[];
  maxWorkers?: number;
  dev: boolean;
  clear: boolean;
  quiet: boolean;
  dumpAssetmap: boolean;
  dumpSourcemap: boolean;
};

export async function resolveOptionsAsync(projectRoot: string, args: any): Promise<Options> {
  const platform = args['--platform'] ?? 'all';
  if (platform) {
    assert.match(platform, /^(all|android|ios)$/);
  }

  return {
    outputDir: args['--output-dir'] ?? 'dist',
    platform,
    mergeSrcUrl: args['--merge-src-url'] ?? [],
    mergeSrcDir: args['--merge-src-dir'] ?? [],
    clear: !!args['--clear'],
    quiet: !!args['--quiet'],
    dev: !!args['--dev'],
    maxWorkers: args['--max-workers'],
    dumpAssetmap: !!args['--dump-assetmap'],
    dumpSourcemap: !!args['--dump-sourcemap'],
  };
}
