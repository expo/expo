#!/usr/bin/env node
import chalk from 'chalk';

import { Command } from '../../bin/cli';
import * as Log from '../log';
import { assertArgs, getProjectRoot } from '../utils/args';
import { configAsync } from './configAsync';

export const expoConfig: Command = (argv) => {
  const args = assertArgs(
    {
      // Types
      '--help': Boolean,
      '--full': Boolean,
      '--json': Boolean,
      '--type': String,
      // Aliases
      '-h': '--help',
      '-t': '--type',
    },
    argv
  );

  if (args['--help']) {
    Log.exit(
      chalk`
      {bold Description}
        Show the project config

      {bold Usage}
        $ expo config <dir>

      <dir> represents the directory of the Expo application.
      If no directory is provided, the current directory will be used.

      Options
      --full                                   Include all project config data
      --json                                   Output in JSON format
      -t, --type <public|prebuild|introspect>  Type of config to show
      -h, --help                               output usage information
    `,
      0
    );
  }

  return configAsync(getProjectRoot(args), {
    // Parsed options
    full: args['--full'],
    json: args['--json'],
    type: args['--type'],
  }).catch((err) => {
    Log.exit(err);
  });
};
