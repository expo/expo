import path from 'path';

import type { EnvironmentMode } from '../utils/nodeEnv';

export type Options = {
  mode: EnvironmentMode;
  outputDir?: string;
};

export type ResolvedOptions = {
  mode: EnvironmentMode;
  outputDir?: string;
};

export function resolveOptions(projectRoot: string, options: Options): ResolvedOptions {
  return {
    mode: options.mode,
    outputDir: options.outputDir ? path.resolve(projectRoot, options.outputDir) : undefined,
  };
}
