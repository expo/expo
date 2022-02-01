#!/usr/bin/env node
import chalk from 'chalk';

import { Command } from '../../bin/cli';
import * as Log from '../log';
import { assertArgs } from '../utils/args';
import { logCmdError } from '../utils/errors';

export const expoRegister: Command = async (argv) => {
  const args = assertArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    argv
  );

  if (args['--help']) {
    Log.exit(
      chalk`
      {bold Description}
        Sign up for a new Expo account

      {bold Usage}
        $ npx expo register

      Options
      -h, --help    Output usage information
    `,
      0
    );
  }

  const { registerAsync } = await import('./registerAsync');
  return registerAsync().catch(logCmdError);
};
