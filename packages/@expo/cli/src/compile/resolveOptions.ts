import path from 'path';

export type Options = {
  outputDir?: string;
};

export type ResolvedOptions = {
  outputDir?: string;
};

export function resolveOptions(projectRoot: string, options: Options): ResolvedOptions {
  return {
    outputDir: options.outputDir ? path.resolve(projectRoot, options.outputDir) : undefined,
  };
}
