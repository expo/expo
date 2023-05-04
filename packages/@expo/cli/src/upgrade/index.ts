#!/usr/bin/env node
import chalk from 'chalk';

import { Command } from '../../bin/cli';
import { assertArgs, getProjectRoot, printHelp } from '../utils/args';
import { CommandError } from '../utils/errors';

export const expoUpgrade: Command = async (argv) => {
  const args = assertArgs(
    {
      '--sdk-version': String,
      '--npm': Boolean,
      '--pnpm': Boolean,
      '--yarn': Boolean,
      // Other options are parsed manually.
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    argv
  );

  if (args['--help']) {
    printHelp(
      `Upgrade the React project to a newer version of Expo. Does not update native code.`,
      `npx expo upgrade`,
      [
        `--sdk-version  Expo SDK version to upgrade to`,
        chalk`--npm          Use npm to install dependencies. {dim Default when package-lock.json exists}`,
        chalk`--yarn         Use Yarn to install dependencies. {dim Default when yarn.lock exists}`,
        chalk`--pnpm         Use pnpm to install dependencies. {dim Default when pnpm-lock.yaml exists}`,
        `-h, --help     Usage info`,
      ].join('\n')
    );
  }
  const options = {
    version: args['--sdk-version'],
    npm: args['--npm'],
    yarn: args['--yarn'],
    pnpm: args['--pnpm'],
  };

  if ([options.npm, options.pnpm, options.yarn].filter(Boolean).length > 1) {
    throw new CommandError('BAD_ARGS', 'Specify at most one of: --npm, --pnpm, --yarn');
  }

  const { upgradeAsync } = require('./upgradeAsync') as typeof import('./upgradeAsync');
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');

  return (async () => upgradeAsync(getProjectRoot(args), options))().catch(logCmdError);
};
