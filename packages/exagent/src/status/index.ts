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
      '--no-followups': Boolean,
      // Aliases
      '-h': '--help',
    },
    { argv }
  );

  if (args['--help']) {
    printHelp(
      `Where the project is now and what would happen next`,
      chalk`npx exagent status`,
      [
        `--json                    Print the whole report as JSON, raw project probe included`,
        `--dev-server-url <url>    Dev server to probe (default: scan ports 8081-8085)`,
        `--no-followups            Leave the suggested follow-up commands out of the report`,
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
        chalk`  {bold --json} carries the raw project probe too, under {bold probe}: the SDK version, the`,
        chalk`  native state, the fingerprint, and every reason Expo Go cannot run the project, exactly`,
        chalk`  as the probe read them. That is the project brief, so nothing needs a second command.`,
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
    const explicitDevServerUrl =
      args['--dev-server-url'] != null ? resolveDevServerUrlFlag(args['--dev-server-url']) : null;
    await printStatusAsync(projectRoot, {
      devServerUrl: explicitDevServerUrl,
      json: !!args['--json'],
      followups: !args['--no-followups'],
    });
  })().catch(logCmdError);
};
