#!/usr/bin/env node
import chalk from 'chalk';

import { Command } from './cli';
import { syncConfigurationToNativeAsync } from './syncConfigurationToNativeAsync';
import { requireArg, assertArgs, getProjectRoot } from './utils/args';
import * as Log from './utils/log';

export const syncConfigurationToNative: Command = async (argv) => {
  const args = assertArgs(
    {
      // Types
      '--help': Boolean,
      '--platform': String,
      // Aliases
      '-h': '--help',
    },
    argv ?? []
  );

  if (args['--help']) {
    Log.exit(
      chalk`
{bold Description}
Sync configuration from Expo config to native project files if applicable. Note that this really
only needs to be used by the EAS CLI for generic projects that do't use continuous native generation.

{bold Usage}
  {dim $} npx expo-updates configuration:syncnative --platform <platform>

  Options
  --platform <string>                  Platform to sync
  -h, --help                           Output usage information
    `,
      0
    );
  }

  const platform = requireArg(args, '--platform');
  if (!['ios', 'android'].includes(platform)) {
    throw new Error(`Invalid platform argument: ${platform}`);
  }

  await syncConfigurationToNativeAsync({
    projectRoot: getProjectRoot(args),
    platform,
  });
};
