import path from 'path';

import type { EnvironmentMode } from '../utils/nodeEnv';

export type Options = {
  mode: EnvironmentMode;
  device?: string;
  outputDir?: string;
};

export type ResolvedOptions = {
  mode: EnvironmentMode;
  device?: string;
  outputDir?: string;
};

export function resolveOptions(projectRoot: string, options: Options): ResolvedOptions {
  return {
    mode: options.mode,
    device: options.device,
    outputDir: options.outputDir ? path.resolve(projectRoot, options.outputDir) : undefined,
  };
}
