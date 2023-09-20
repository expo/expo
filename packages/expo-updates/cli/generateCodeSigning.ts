#!/usr/bin/env node
import chalk from 'chalk';

import { Command } from './cli';
import { requireArg, assertArgs, getProjectRoot } from './utils/args';
import * as Log from './utils/log';

export const generateCodeSigning: Command = async (argv) => {
  const args = assertArgs(
    {
      // Types
      '--help': Boolean,
      '--key-output-directory': String,
      '--certificate-output-directory': String,
      '--certificate-validity-duration-years': Number,
      '--certificate-common-name': String,
      // Aliases
      '-h': '--help',
    },
    argv ?? []
  );

  if (args['--help']) {
    Log.exit(
      chalk`
{bold Description}
Generate expo-updates private key, public key, and code signing certificate using that public key (self-signed by the private key)

{bold Usage}
  {dim $} npx expo-updates codesigning:generate --key-output-directory <dir> --certificate-output-directory <dir> --certificate-validity-duration-years <num years> --certificate-common-name <name>

  Options
  --key-output-directory <string>                  Directory in which to put the generated private and public keys
  --certificate-output-directory <string>          Directory in which to put the generated certificate
  --certificate-validity-duration-years <number>   Certificate validity duration in years (number of years before certificate needs rotation)
  --certificate-common-name <string>               Common name attribute for certificate (generally the human readable name of the organization owning this application)
  -h, --help                                       Output usage information
    `,
      0
    );
  }

  const { generateCodeSigningAsync } = await import('./generateCodeSigningAsync.js');

  const keyOutput = requireArg(args, '--key-output-directory');
  const certificateOutput = requireArg(args, '--certificate-output-directory');
  const certificateValidityDurationYears = requireArg(
    args,
    '--certificate-validity-duration-years'
  );
  const certificateCommonName = requireArg(args, '--certificate-common-name');

  return await generateCodeSigningAsync(getProjectRoot(args), {
    certificateValidityDurationYears,
    keyOutput,
    certificateOutput,
    certificateCommonName,
  });
};
