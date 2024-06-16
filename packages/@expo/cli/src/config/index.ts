#!/usr/bin/env node
import chalk from 'chalk';

import { Command } from '../../bin/cli';
import { assertArgs, getProjectRoot, printHelp } from '../utils/args';

export const expoConfig: Command = async (argv) => {
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
    printHelp(
      `Show the project config`,
      chalk`npx expo config {dim <dir>}`,
      [
        chalk`<dir>                                    Directory of the Expo project. {dim Default: Current working directory}`,
        `--full                                   Include all project config data`,
        `--json                                   Output in JSON format`,
        `-t, --type <public|prebuild|introspect>  Type of config to show`,
        `-h, --help                               Usage info`,
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx expo config -h` shows as fast as possible.
  const [
    // ./configAsync
    { configAsync },
    // ../utils/errors
    { logCmdError },
  ] = await Promise.all([import('./configAsync.js'), import('../utils/errors.js')]);

  return configAsync(getProjectRoot(args), {
    // Parsed options
    full: args['--full'],
    json: args['--json'],
    type: args['--type'],
  }).catch(logCmdError);
};
