import path from 'path';

import { maybeRealpathSync } from '../utils/dir';
import { CommandError } from '../utils/errors';
import type { EnvironmentMode } from '../utils/nodeEnv';
import { resolveMode } from './resolveMode';

export type Platform = 'ios' | 'android';

export type OutputType = 'app' | 'ipa' | 'apk' | 'aab';

const platforms: Record<Platform, { installable: OutputType; store: OutputType; target: string }> =
  {
    ios: { installable: 'app', store: 'ipa', target: 'the simulator' },
    android: { installable: 'apk', store: 'aab', target: 'all architectures' },
  };

export type Options = {
  dev?: boolean;
  prod?: boolean;
  device?: string;
  'output-dir'?: string;
  'output-type'?: string;
};

export type ResolvedOptions = {
  mode: EnvironmentMode;
  outputDir?: string;
  outputType: OutputType;
};

export function resolveOptions(platform: Platform, options: Options): ResolvedOptions {
  const mode = resolveMode(options);
  const outputType = resolveOutputType({
    platform,
    mode,
    device: options.device,
    outputType: options['output-type'],
  });
  const { installable, target } = platforms[platform];
  if (options.device) {
    throw new CommandError(
      'BAD_ARGS',
      `Device builds are not supported yet. Omit --device to build for ${target}.`
    );
  }
  if (outputType !== installable) {
    throw new CommandError(
      'BAD_ARGS',
      `Building an ${outputType} is not supported yet. Omit --output-type to build an ${installable}.`
    );
  }
  return { mode, outputDir: options['output-dir'], outputType };
}

export function resolveOutputDir(projectRoot: string, outputDir?: string): string | undefined {
  if (!outputDir) {
    return undefined;
  }
  const resolvedOutputDir = path.resolve(projectRoot, outputDir);
  return maybeRealpathSync(resolvedOutputDir) ?? resolvedOutputDir;
}

function resolveOutputType({
  platform,
  mode,
  device,
  outputType,
}: {
  platform: Platform;
  mode: EnvironmentMode;
  device?: string;
  outputType?: string;
}): OutputType {
  const { installable, store } = platforms[platform];
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
