#!/usr/bin/env node
import chalk from 'chalk';

import type { Command } from '../../index';
import { assertArgs, getProjectRoot, printHelp } from '../../utils/args';
import { logCmdError } from '../../utils/errors';

export const expoCompileIos: Command = async (argv) => {
  const args = assertArgs(
    {
      '--help': Boolean,
      '--dev': Boolean,
      '--prod': Boolean,
      '--device': String,
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
        `--device <device>   Device name or ID to build the app for`,
        `--output-dir <dir>  Directory to copy the built app to`,
        `-h, --help          Usage info`,
      ].join('\n')
    );
  }

  return (async () => {
    const projectRoot = getProjectRoot(args);
    const { resolveMode } = await import('../resolveMode.js');
    const mode = resolveMode({
      dev: args['--dev'],
      prod: args['--prod'],
      device: args['--device'],
    });
    const { loadEnvFiles } = await import('../../utils/nodeEnv.js');
    loadEnvFiles(projectRoot, { mode });

    const { resolveOptions } = await import('../resolveOptions.js');
    const options = resolveOptions(projectRoot, {
      mode,
      device: args['--device'],
      outputDir: args['--output-dir'],
    });

    const { compileIosAsync } = await import('./compileIosAsync.js');
    return compileIosAsync(projectRoot, options);
  })().catch(logCmdError);
};
