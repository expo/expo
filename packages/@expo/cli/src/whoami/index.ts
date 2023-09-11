#!/usr/bin/env node
import { Command } from '../../bin/cli';
import { assertArgs, printHelp } from '../utils/args';
import { logCmdError } from '../utils/errors';

export const expoWhoami: Command = async (argv) => {
  const args = assertArgs(
    {
      // Types
      '--help': Boolean,
      '--username': Boolean,
      // Aliases
      '-h': '--help',
    },
    argv
  );

  if (args['--help']) {
    printHelp(
      `Show the currently authenticated user information`,
      `npx expo whoami`,
      [
        `-h, --help    Usage info`,
        `--username    Print only the username of the authenticated user`,
      ].join('\n')
    );
  }

  const { whoamiAsync } = await import('./whoamiAsync');
  return whoamiAsync({ printOnlyUsername: args['--username'] }).catch(logCmdError);
};
