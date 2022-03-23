#!/usr/bin/env node
import chalk from 'chalk';

import { Command } from '../../bin/cli';
import * as Log from '../log';
import { assertArgs } from '../utils/args';
import { logCmdError } from '../utils/errors';

export const expoLogout: Command = async (argv) => {
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
        Log out of an Expo account

      {bold Usage}
        $ npx expo logout

      Options
      -h, --help    Output usage information
    `,
      0
    );
  }

  const { logoutAsync } = await import('../api/user/user');
  return logoutAsync().catch(logCmdError);
};
