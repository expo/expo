#!/usr/bin/env node
import chalk from 'chalk';

import { Command } from './cli';
import { requireArg, assertArgs, getProjectRoot } from './utils/args';
import { CommandError } from './utils/errors';
import * as Log from './utils/log';
import { withConsoleDisabledAsync } from './utils/withConsoleDisabledAsync';

export const generateFingerprint: Command = async (argv) => {
  const args = assertArgs(
    {
      // Types
      '--help': Boolean,
      '--platform': String,
      '--workflow': String,
      '--debug': Boolean,
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
  --workflow <string>                  Workflow to use for fingerprint generation, and auto-detected if not provided
  --debug                              Whether to include verbose debug information in output
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
    throw new CommandError(`Invalid platform argument: ${platform}`);
  }

  const workflowArg = args['--workflow'];
  if (workflowArg && !['generic', 'managed'].includes(workflowArg)) {
    throw new CommandError(
      `Invalid workflow argument: ${workflowArg}. Must be either 'managed' or 'generic'`
    );
  }

  const debug = args['--debug'];

  const projectRoot = getProjectRoot(args);

  const result = await withConsoleDisabledAsync(async () => {
    try {
      const workflow = workflowArg ?? (await resolveWorkflowAsync(projectRoot, platform));
      return await createFingerprintAsync(projectRoot, platform, workflow, {
        silent: true,
        debug,
      });
    } catch (e: any) {
      throw new CommandError(e.message);
    }
  });

  console.log(JSON.stringify(result));
};
