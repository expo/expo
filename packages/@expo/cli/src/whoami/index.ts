#!/usr/bin/env node
import chalk from 'chalk';

import { Command } from '../../bin/cli';
import * as Log from '../log';
import { assertArgs } from '../utils/args';
import { logCmdError } from '../utils/errors';

export const expoWhoami: Command = async (argv) => {
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
        Show the currently authenticated username

      {bold Usage}
        $ npx expo whoami

      Options
      -h, --help    Output usage information
    `,
      0
    );
  }

  const { whoamiAsync } = await import('./whoamiAsync');
  return whoamiAsync().catch(logCmdError);
};
