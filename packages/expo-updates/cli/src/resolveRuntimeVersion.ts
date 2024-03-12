#!/usr/bin/env node
import chalk from 'chalk';

import { Command } from './cli';
import { requireArg, assertArgs, getProjectRoot } from './utils/args';
import * as Log from './utils/log';

export const resolveRuntimeVersion: Command = async (argv) => {
  const args = assertArgs(
    {
      // Types
      '--help': Boolean,
      '--platform': String,
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
    throw new Error(`Invalid platform argument: ${platform}`);
  }

  const debug = args['--debug'];

  const runtimeVersionInfo = await resolveRuntimeVersionAsync(getProjectRoot(args), platform, {
    silent: true,
    debug,
  });
  console.log(JSON.stringify(runtimeVersionInfo));
};
