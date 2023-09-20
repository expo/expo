#!/usr/bin/env node
import { Command } from '../../bin/cli';
import { assertArgs, printHelp } from '../utils/args';
import { logCmdError } from '../utils/errors';

export const expoLogin: Command = async (argv) => {
  const args = assertArgs(
    {
      // Types
      '--help': Boolean,
      '--username': String,
      '--password': String,
      '--otp': String,
      '--sso': Boolean,
      // Aliases
      '-h': '--help',
      '-u': '--username',
      '-p': '--password',
      '-s': '--sso',
    },
    argv
  );

  if (args['--help']) {
    printHelp(
      `Log in to an Expo account`,
      `npx expo login`,
      [
        `-u, --username <string>  Username`,
        `-p, --password <string>  Password`,
        `--otp <string>           One-time password from your 2FA device`,
        // hiding from help until SSO is public
        // `-s, --sso                Log in with SSO`,
        `-h, --help               Usage info`,
      ].join('\n')
    );
  }

  const { showLoginPromptAsync } = await import('../api/user/actions.js');
  return showLoginPromptAsync({
    // Parsed options
    username: args['--username'],
    password: args['--password'],
    otp: args['--otp'],
    sso: !!args['--sso'],
  }).catch(logCmdError);
};
