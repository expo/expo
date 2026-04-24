#!/usr/bin/env node
import type { Command } from '../index';
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
      '--browser': Boolean,
      // Aliases
      '-h': '--help',
      '-u': '--username',
      '-p': '--password',
      '-s': '--sso',
      '-b': '--browser',
    },
    argv
  );

  if (args['--help']) {
    printHelp(
      `Log in to an Expo account`,
      `npx expo login`,
      [
        `-u, --username <string>  Username`,
        `-p, --password <string>  Password ("-" for stdin)`,
        `--otp <string>           One-time password from your 2FA device`,
        `-s, --sso                Log in with SSO`,
        `-b, --browser            Log in with a browser`,
        `-h, --help               Usage info`,
      ].join('\n')
    );
  }

  const password = args['--password'] === '-' ? await readWordFromStdin() : args['--password'];

  const { showLoginPromptAsync } = await import('../api/user/actions.js');
  return showLoginPromptAsync({
    // Parsed options
    username: args['--username'],
    password,
    otp: args['--otp'],
    sso: !!args['--sso'],
    browser: !!args['--browser'],
  }).catch(logCmdError);
};

export async function readWordFromStdin(): Promise<string> {
  let buffer = '';
  for await (const chunk of process.stdin) {
    buffer += chunk;
    const newlineIndex = buffer.indexOf('\n');
    if (newlineIndex !== -1) {
      return buffer.slice(0, newlineIndex).replace(/\r$/, '');
    }
  }
  return buffer;
}
