#!/usr/bin/env node
import chalk from 'chalk';

import { Command } from './cli';
import { assertArgs, getProjectRoot } from './utils/args';
import * as Log from './utils/log';

export const generateCodeSigning: Command = async (argv) => {
  const args = assertArgs(
    {
      // Types
      '--help': Boolean,
      '--output': String,
      '--validity-duration-years': Number,
      '--common-name': String,
      // Aliases
      '-h': '--help',
      '-o': '--output',
      '-d': '--validity-duration-years',
      '-c': '--common-name',
    },
    argv ?? []
  );

  if (args['--help']) {
    Log.exit(
      chalk`
      {bold Description}
      Generate expo-updates code signing keys and certificates

      {bold Usage}
        $ npx expo-updates codesigning:generate

        Options
        -o, --output <string>                   Directory in which to put the generated keys and certificate
        -d, --validity-duration-years <number>  Validity duration in years
        -c, --common-name <string>              Common name attribute for certificate
        -h, --help                              Output usage information
    `,
      0
    );
  }

  const { generateCodeSigningAsync } = await import('./generateCodeSigningAsync');
  return await generateCodeSigningAsync(getProjectRoot(args), {
    validityDurationYears: args['--validity-duration-years'],
    output: args['--output'],
    commonName: args['--common-name'],
  });
};
