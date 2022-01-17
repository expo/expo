#!/usr/bin/env node
import chalk from 'chalk';

import { Command } from '../../bin/cli';
import * as Log from '../log';
import { assertArgs, getProjectRoot } from '../utils/args';
import { logCmdError } from '../utils/errors';
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
        $ npx expo config <dir>

      <dir> is the directory of the Expo project.
      Defaults to the current working directory.

      Options
      --full                                   Include all project config data
      --json                                   Output in JSON format
      -t, --type <public|prebuild|introspect>  Type of config to show
      -h, --help                               Output usage information
    `,
      0
    );
  }

  return configAsync(getProjectRoot(args), {
    // Parsed options
    full: args['--full'],
    json: args['--json'],
    type: args['--type'],
  }).catch(logCmdError);
};
