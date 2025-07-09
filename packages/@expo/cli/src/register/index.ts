#!/usr/bin/env node
import { Command } from '../../bin/cli';
import { assertArgs, printHelp } from '../utils/args';
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
    printHelp(
      `Sign up for a new Expo account`,
      `npx expo register`,
      // Options
      `-h, --help    Usage info`
    );
  }

  const { registerAsync } = await import('./registerAsync.js');
  return registerAsync().catch(logCmdError);
};
