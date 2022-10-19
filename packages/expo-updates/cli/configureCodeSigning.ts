#!/usr/bin/env node
import chalk from 'chalk';

import { Command } from './cli';
import { requireArg, assertArgs, getProjectRoot } from './utils/args';
import * as Log from './utils/log';

export const configureCodeSigning: Command = async (argv) => {
  const args = assertArgs(
    {
      // Types
      '--help': Boolean,
      '--certificate-input-directory': String,
      '--key-input-directory': String,
      '--keyid': String,
      // Aliases
      '-h': '--help',
    },
    argv ?? []
  );

  if (args['--help']) {
    Log.exit(
      chalk`
{bold Description}
Configure expo-updates code signing for this project and verify setup

{bold Usage}
  {dim $} npx expo-updates codesigning:configure --certificate-input-directory <dir> --key-input-directory <dir>

  Options
  --certificate-input-directory <string>     Directory containing code signing certificate
  --key-input-directory <string>             Directory containing private and public keys
  -h, --help                                 Output usage information
    `,
      0
    );
  }

  const { configureCodeSigningAsync } = await import('./configureCodeSigningAsync');

  const certificateInput = requireArg(args, '--certificate-input-directory');
  const keyInput = requireArg(args, '--key-input-directory');
  const keyid = args['--keyid'];

  return await configureCodeSigningAsync(getProjectRoot(args), {
    certificateInput,
    keyInput,
    keyid,
  });
};
