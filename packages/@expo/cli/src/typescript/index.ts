#!/usr/bin/env node

import { Command } from '../../bin/cli';
import { assertArgs, printHelp, getProjectRoot } from '../utils/args';
import { logCmdError } from '../utils/errors';
import { typescriptAsync } from './typescriptAsync';

export const expoTypescript: Command = async (argv) => {
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
      `Setup Typescript and generate types for Expo packages`,
      `npx expo typescript`,
      [`-h, --help               Usage info`].join('\n')
    );
  }

  const projectRoot = getProjectRoot(args);
  return typescriptAsync(projectRoot).catch(logCmdError);
};
