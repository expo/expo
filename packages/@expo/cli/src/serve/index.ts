#!/usr/bin/env node
import chalk from 'chalk';

import type { Command } from '../../bin/cli';
import { assertArgs, getProjectRoot, printHelp } from '../utils/args';

export const expoServe: Command = async (argv) => {
  const args = assertArgs(
    {
      // Types
      '--help': Boolean,
      '--port': Number,

      // Aliases
      '-h': '--help',
    },
    argv
  );

  if (args['--help']) {
    printHelp(
      `Host the production server locally`,
      chalk`npx expo serve {dim <dir>}`,
      [
        chalk`<dir>            Directory of the Expo project. {dim Default: Current working directory}`,
        `--port <number>  Port to host the server on`,
        `-h, --help       Usage info`,
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx expo config -h` shows as fast as possible.
  const [
    // ./configAsync
    { serveAsync },
    // ../utils/errors
    { logCmdError },
  ] = await Promise.all([import('./serveAsync.js'), import('../utils/errors.js')]);

  const projectRoot = getProjectRoot(args);
  const { installEventLogger, getWellKnownTemporaryLogFile } = await import('../events/index.js');
  installEventLogger(getWellKnownTemporaryLogFile(projectRoot, 'serve'));

  return serveAsync(projectRoot, {
    isDefaultDirectory: !args._[0],
    // Parsed options
    port: args['--port'],
  }).catch(logCmdError);
};
