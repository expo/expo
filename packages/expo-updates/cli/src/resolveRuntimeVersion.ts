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

  const runtimeVersion = await resolveRuntimeVersionAsync(getProjectRoot(args), platform);
  console.log(JSON.stringify({ runtimeVersion }));
};
