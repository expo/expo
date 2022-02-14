#!/usr/bin/env node
import chalk from 'chalk';

import { Command } from './cli';
import { assertArgs, getProjectRoot } from './utils/args';
import * as Log from './utils/log';

export const configureCodeSigning: Command = async (argv) => {
  const args = assertArgs(
    {
      // Types
      '--help': Boolean,
      '--input': String,
      // Aliases
      '-h': '--help',
      '-i': '--input',
    },
    argv ?? []
  );

  if (args['--help']) {
    Log.exit(
      chalk`
      {bold Description}
      Configure and validate expo-updates code signing for this project

      {bold Usage}
        $ npx expo-updates codesigning:configure

        Options
        -i, --input <string>     Directory containing keys and certificate
        -h, --help               Output usage information
    `,
      0
    );
  }

  const { configureCodeSigningAsync } = await import('./configureCodeSigningAsync');
  return await configureCodeSigningAsync(getProjectRoot(args), {
    input: args['--input'],
  });
};
