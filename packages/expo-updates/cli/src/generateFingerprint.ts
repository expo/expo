#!/usr/bin/env node
import chalk from 'chalk';

import { Command } from './cli';
import { requireArg, assertArgs, getProjectRoot } from './utils/args';
import * as Log from './utils/log';

export const generateFingerprint: Command = async (argv) => {
  const args = assertArgs(
    {
      // Types
      '--help': Boolean,
      '--platform': String,
      // Aliases
      '-h': '--help',
    },
    argv ?? []
  );

  if (args['--help']) {
    Log.exit(
      chalk`
{bold Description}
Generate fingerprint for use in expo-updates runtime version

{bold Usage}
  {dim $} npx expo-updates fingerprint:generate --platform <platform>

  Options
  --platform <string>                  Platform to generate a fingerprint for
  -h, --help                           Output usage information
    `,
      0
    );
  }

  const { createFingerprintAsync } = await import('../../utils/build/createFingerprintAsync.js');

  const platform = requireArg(args, '--platform');
  if (!['ios', 'android'].includes(platform)) {
    throw new Error(`Invalid platform argument: ${platform}`);
  }

  const result = await createFingerprintAsync(getProjectRoot(args), platform);
  console.log(JSON.stringify(result));
};
