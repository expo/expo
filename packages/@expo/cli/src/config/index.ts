#!/usr/bin/env node
import chalk from 'chalk';

import type { Command } from '../index';
import { assertArgs, getProjectRoot, printHelp } from '../utils/args';

export const expoConfig: Command = async (argv) => {
  const args = assertArgs(
    {
      // Types
      '--help': Boolean,
      '--full': Boolean,
      '--json': Boolean,
      '--type': String,
      // Aliases
      '-h': '--help',
      '-t': '--type',
    },
    argv
  );

  if (args['--help']) {
    printHelp(
      `Show the project config`,
      chalk`npx expo config {dim <dir>}`,
      [
        chalk`<dir>                                    Directory of the Expo project. {dim Default: Current working directory}`,
        `--full                                   Include all project config data`,
        `--json                                   Output in JSON format`,
        `-t, --type <public|prebuild|introspect>  Type of config to show`,
        `-h, --help                               Usage info`,
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx expo config -h` shows as fast as possible.
  const [{ getConfigEnvMode, loadEnvFiles }, { logCmdError }] = await Promise.all([
    import('../utils/nodeEnv.js'),
    import('../utils/errors.js'),
  ]);

  return (async () => {
    const projectRoot = getProjectRoot(args);
    loadEnvFiles(projectRoot, { mode: getConfigEnvMode(), silent: args['--json'] });

    const { configAsync } = await import('./configAsync.js');
    return configAsync(projectRoot, {
      full: args['--full'],
      json: args['--json'],
      type: args['--type'],
    });
  })().catch(logCmdError);
};
