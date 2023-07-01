#!/usr/bin/env node
import chalk from 'chalk';

import { Command } from '../../bin/cli';
import { assertArgs, getProjectRoot, printHelp } from '../utils/args';

export const expoPush: Command = async (argv) => {
  const args = assertArgs(
    {
      // TODO: Android, device
      // Types
      '--help': Boolean,
      '--ios': Boolean,
      '--go': Boolean,
      '--dev-client': Boolean,
      '--force': Boolean,
      // Aliases
      '-f': '--force',
      '-d': '--dev-client',
      '-g': '--go',
      '-i': '--ios',
      '-h': '--help',
      '-t': '--type',
    },
    argv
  );

  if (args['--help']) {
    printHelp(
      `Push a notification to the simulator`,
      chalk`npx expo push {dim <dir>}`,
      [
        chalk`<dir>                                    Directory of the Expo project. {dim Default: Current working directory}`,

        `-h, --help                               Usage info`,
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx expo config -h` shows as fast as possible.
  const [
    { pushAsync },
    // ../utils/errors
    { logCmdError },
  ] = await Promise.all([import('./pushAsync'), import('../utils/errors')]);

  return pushAsync(getProjectRoot(args), {
    // Parsed options
    devClient: args['--dev-client'],
    go: args['--go'],
    force: args['--force'],
  }).catch(logCmdError);
};
