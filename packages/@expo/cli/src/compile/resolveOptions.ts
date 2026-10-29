import path from 'path';

import { CommandError } from '../utils/errors';
import type { EnvironmentMode } from '../utils/nodeEnv';

export type Platform = 'ios' | 'android';

export type OutputType = 'app' | 'ipa' | 'apk' | 'aab';

const outputTypes: Record<Platform, { installable: OutputType; store: OutputType }> = {
  ios: { installable: 'app', store: 'ipa' },
  android: { installable: 'apk', store: 'aab' },
};

export type Options = {
  platform: Platform;
  mode: EnvironmentMode;
  device?: string;
  outputDir?: string;
  outputType?: string;
};

export type ResolvedOptions = {
  mode: EnvironmentMode;
  device?: string;
  outputDir?: string;
  outputType: OutputType;
};

export function resolveOptions(projectRoot: string, options: Options): ResolvedOptions {
  return {
    mode: options.mode,
    device: options.device,
    outputDir: options.outputDir ? path.resolve(projectRoot, options.outputDir) : undefined,
    outputType: resolveOutputType(options),
  };
}

function resolveOutputType({ platform, mode, device, outputType }: Options): OutputType {
  const { installable, store } = outputTypes[platform];
  if (!outputType) {
    return mode === 'production' && !device ? store : installable;
  }
  if (outputType === installable || outputType === store) {
    return outputType;
  }
  throw new CommandError(
    'BAD_ARGS',
    `Invalid option: --output-type ${outputType}. Valid options are: ${installable}, ${store}`
  );
}
