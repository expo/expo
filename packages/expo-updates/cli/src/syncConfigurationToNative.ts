#!/usr/bin/env node
import chalk from 'chalk';

import { Command } from './cli';
import { syncConfigurationToNativeAsync } from './syncConfigurationToNativeAsync';
import { requireArg, assertArgs, getProjectRoot } from './utils/args';
import { CommandError } from './utils/errors';
import * as Log from './utils/log';

export const syncConfigurationToNative: Command = async (argv) => {
  const args = assertArgs(
    {
      // Types
      '--help': Boolean,
      '--platform': String,
      '--workflow': String,
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
  --workflow <string>                  Workflow to use for configuration sync
  -h, --help                           Output usage information
    `,
      0
    );
  }

  const platform = requireArg(args, '--platform');
  if (!['ios', 'android'].includes(platform)) {
    throw new CommandError(`Invalid platform argument: ${platform}`);
  }

  const workflow = requireArg(args, '--workflow');
  if (!['generic', 'managed'].includes(workflow)) {
    throw new CommandError(
      `Invalid workflow argument: ${workflow}. Must be either 'managed' or 'generic'`
    );
  }

  await syncConfigurationToNativeAsync({
    projectRoot: getProjectRoot(args),
    platform,
    workflow,
  });
};
