#!/usr/bin/env node

import { Command } from '../../bin/cli';
import { assertArgs, printHelp } from '../utils/args';
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
    printHelp(
      `Log out of an Expo account`,
      `npx expo logout`,
      // options
      `-h, --help    Usage info`
    );
  }

  const { logoutAsync } = await import('../api/user/user.js');
  return logoutAsync().catch(logCmdError);
};
