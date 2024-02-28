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

  const [{ createFingerprintAsync }, { resolveWorkflowAsync }] = await Promise.all([
    import('../../utils/build/createFingerprintAsync.js'),
    import('../../utils/build/workflow.js'),
  ]);

  const platform = requireArg(args, '--platform');
  if (!['ios', 'android'].includes(platform)) {
    throw new Error(`Invalid platform argument: ${platform}`);
  }

  const projectRoot = getProjectRoot(args);
  const workflow = await resolveWorkflowAsync(projectRoot, platform);
  const result = await createFingerprintAsync(projectRoot, platform, workflow, { silent: true });
  console.log(JSON.stringify(result));
};
