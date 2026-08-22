import chalk from 'chalk';

import type { Command } from '../types';
import { assertWithOptionsArgs, printHelp } from '../utils/args';

export const exagentContext: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      '--json': Boolean,
      '--no-followups': Boolean,
      // Aliases
      '-h': '--help',
    },
    { argv }
  );

  if (args['--help']) {
    printHelp(
      `Print what the project is: SDK version, native state, Expo Go support and fingerprint`,
      chalk`npx exagent context`,
      [
        `--json          Print the project state as JSON`,
        `--no-followups  Skip the "Next:" section of suggested follow-up commands`,
        `-h, --help      Usage info`,
      ].join('\n'),
      [
        '',
        chalk`  The JSON output is the project brief for agents: every field is a fact read from`,
        chalk`  the project, so no decision is guessed from terminal output.`,
        '',
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx exagent context -h` shows as fast as possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  const { findUpProjectRootOrAssert } =
    require('../utils/findUp') as typeof import('../utils/findUp');
  const { printProjectContextAsync } = require('./contextAsync') as typeof import('./contextAsync');

  return (async () => {
    const projectRoot = findUpProjectRootOrAssert(process.cwd());
    await printProjectContextAsync(projectRoot, {
      json: !!args['--json'],
      followups: !args['--no-followups'],
    });
  })().catch(logCmdError);
};
