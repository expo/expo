#!/usr/bin/env node
import chalk from 'chalk';

import type { Command } from '../../index';
import * as Log from '../../log';
import { assertArgs, getProjectRoot, printHelp } from '../../utils/args';
import { logCmdError } from '../../utils/errors';

export const expoCompileAndroid: Command = async (argv) => {
  const args = assertArgs(
    {
      '--help': Boolean,
      '--dev': Boolean,
      '--prod': Boolean,
      '-h': '--help',
    },
    argv
  );

  if (args['--help']) {
    printHelp(
      `Build the Android app binary locally`,
      chalk`npx expo compile:android {dim <dir>}`,
      [
        chalk`<dir>       Directory of the Expo project. {dim Default: Current working directory}`,
        `--dev       Build in development mode`,
        `--prod      Build in production mode (default)`,
        `-h, --help  Usage info`,
      ].join('\n')
    );
  }

  return (async () => {
    const projectRoot = getProjectRoot(args);
    const { resolveMode } = await import('../resolveMode.js');
    const { loadEnvFiles } = await import('../../utils/nodeEnv.js');
    loadEnvFiles(projectRoot, {
      mode: resolveMode({ dev: args['--dev'], prod: args['--prod'] }),
    });

    Log.exit(`expo compile:android is not available yet.`);
  })().catch(logCmdError);
};
