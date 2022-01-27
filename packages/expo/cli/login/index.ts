#!/usr/bin/env node
import chalk from 'chalk';

import { Command } from '../../bin/cli';
import * as Log from '../log';
import { assertArgs } from '../utils/args';
import { logCmdError } from '../utils/errors';

export const expoLogin: Command = async (argv) => {
  const args = assertArgs(
    {
      // Types
      '--help': Boolean,
      '--username': String,
      '--password': String,
      '--otp': String,
      // Aliases
      '-h': '--help',
      '-u': '--username',
      '-p': '--password',
    },
    argv
  );

  if (args['--help']) {
    Log.exit(
      chalk`
      {bold Description}
        Log in to an Expo account

      {bold Usage}
        $ npx expo login

      Options
      -u, --username <string>  Username
      -p, --password <string>  Password
      --otp <string>           One-time password from your 2FA device
      -h, --help               Output usage information
    `,
      0
    );
  }

  const { showLoginPromptAsync } = await import('../utils/user/actions');
  return showLoginPromptAsync({
    // Parsed options
    username: args['--username'],
    password: args['--password'],
    otp: args['--otp'],
  }).catch(logCmdError);
};
