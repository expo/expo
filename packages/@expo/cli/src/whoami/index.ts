#!/usr/bin/env node
import { Command } from '../../bin/cli';
import { assertArgs, printHelp } from '../utils/args';
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
    printHelp(
      `Show the currently authenticated username`,
      `npx expo whoami`,
      `-h, --help    Usage info`
    );
  }

  const { whoamiAsync } = await import('./whoamiAsync.js');
  return whoamiAsync().catch(logCmdError);
};
