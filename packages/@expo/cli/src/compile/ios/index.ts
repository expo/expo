#!/usr/bin/env node
import chalk from 'chalk';

import type { Command } from '../../index';
import * as Log from '../../log';
import { assertArgs, getProjectRoot, printHelp } from '../../utils/args';
import { logCmdError } from '../../utils/errors';

export const expoCompileIos: Command = async (argv) => {
  const args = assertArgs(
    {
      '--help': Boolean,
      '--dev': Boolean,
      '--prod': Boolean,
      '--output-dir': String,
      '-h': '--help',
    },
    argv
  );

  if (args['--help']) {
    printHelp(
      `Build the iOS app binary locally`,
      chalk`npx expo compile:ios {dim <dir>}`,
      [
        chalk`<dir>               Directory of the Expo project. {dim Default: Current working directory}`,
        `--dev               Build in development mode`,
        `--prod              Build in production mode (default)`,
        `--output-dir <dir>  Directory to copy the built app to`,
        `-h, --help          Usage info`,
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

    const { resolveOptions } = await import('../resolveOptions.js');
    resolveOptions(projectRoot, {
      outputDir: args['--output-dir'],
    });

    Log.exit(`expo compile:ios is not available yet.`);
  })().catch(logCmdError);
};
