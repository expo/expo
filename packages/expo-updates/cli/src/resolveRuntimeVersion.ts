#!/usr/bin/env node
import chalk from 'chalk';

import { Command } from './cli';
import { requireArg, assertArgs, getProjectRoot } from './utils/args';
import { CommandError } from './utils/errors';
import * as Log from './utils/log';
import { withConsoleDisabledAsync } from './utils/withConsoleDisabledAsync';

export const resolveRuntimeVersion: Command = async (argv) => {
  const args = assertArgs(
    {
      // Types
      '--help': Boolean,
      '--platform': String,
      '--workflow': String,
      '--debug': Boolean,
      // Aliases
      '-h': '--help',
    },
    argv ?? []
  );

  if (args['--help']) {
    Log.exit(
      chalk`
{bold Description}
Resolve expo-updates runtime version

{bold Usage}
  {dim $} npx expo-updates runtimeversion:resolve --platform <platform>

  Options
  --platform <string>                  Platform to resolve runtime version for
  --workflow <string>                  Workflow to use for runtime version resolution, and auto-detected if not provided
  --debug                              Whether to include verbose debug information in output
  -h, --help                           Output usage information
    `,
      0
    );
  }

  const { resolveRuntimeVersionAsync } = await import(
    '../../utils/build/resolveRuntimeVersionAsync.js'
  );

  const platform = requireArg(args, '--platform');
  if (!['ios', 'android'].includes(platform)) {
    throw new CommandError(`Invalid platform argument: ${platform}`);
  }

  const workflow = args['--workflow'];
  if (workflow && !['generic', 'managed'].includes(workflow)) {
    throw new CommandError(
      `Invalid workflow argument: ${workflow}. Must be either 'managed' or 'generic'`
    );
  }

  const debug = args['--debug'];

  const runtimeVersionInfo = await withConsoleDisabledAsync(async () => {
    try {
      return await resolveRuntimeVersionAsync(
        getProjectRoot(args),
        platform,
        {
          silent: true,
          debug,
        },
        {
          workflowOverride: workflow,
        }
      );
    } catch (e: any) {
      throw new CommandError(e.message);
    }
  });

  console.log(JSON.stringify(runtimeVersionInfo));
};
