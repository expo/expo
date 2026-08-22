import chalk from 'chalk';

import type { Command } from '../types';
import { assertWithOptionsArgs, printHelp } from '../utils/args';

export const exagentStatus: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      '--json': Boolean,
      '--dev-server-url': String,
      // Aliases
      '-h': '--help',
    },
    { argv }
  );

  if (args['--help']) {
    printHelp(
      `Print where the project is right now, and what would happen next`,
      chalk`npx exagent status`,
      [
        `--json                    Print the whole report as JSON`,
        `--dev-server-url <url>    Dev server to probe (default: http://127.0.0.1:8081)`,
        `-h, --help                Usage info`,
      ].join('\n'),
      [
        '',
        chalk`  A read-only overview, like {bold git status}: what the project is, whether Expo Go can`,
        chalk`  run it, whether the last development build still matches, whether a dev server is`,
        chalk`  running with an app connected, which agent skills are linked, and the command that`,
        chalk`  would get the app onto a device.`,
        '',
        chalk`  Nothing is started, built, or written. The command always exits 0, so a script can`,
        chalk`  read the report without branching on the exit code.`,
        '',
        chalk`  Run {bold npx exagent context} for the project facts in full, including every reason`,
        chalk`  Expo Go cannot run the project.`,
        '',
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx exagent status -h` shows as fast as possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  const { findUpProjectRootOrAssert } =
    require('../utils/findUp') as typeof import('../utils/findUp');
  const { resolveDevServerUrlFlag } =
    require('../runtime/devServer') as typeof import('../runtime/devServer');
  const { printStatusAsync } = require('./statusAsync') as typeof import('./statusAsync');

  return (async () => {
    const projectRoot = findUpProjectRootOrAssert(process.cwd());
    await printStatusAsync(projectRoot, {
      devServerUrl: resolveDevServerUrlFlag(args['--dev-server-url']),
      json: !!args['--json'],
    });
  })().catch(logCmdError);
};
