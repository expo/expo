import chalk from 'chalk';

import type { Command } from '../types';
import { assertWithOptionsArgs, printHelp } from '../utils/args';

export const exagentStart: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    {
      argv,
      // Every other option belongs to `expo start` and is forwarded untouched.
      permissive: true,
    }
  );

  if (args['--help']) {
    printHelp(
      `Start the Expo dev server and link the skills the project ships`,
      chalk`npx exagent start {dim [options]}`,
      [
        `--no-agent-skills   Skip linking agent skills from installed packages`,
        `-h, --help          Usage info`,
      ].join('\n'),
      [
        '',
        chalk`  All other arguments are passed to {bold expo start} in the project.`,
        chalk`    {dim $} npx exagent start --web --port 8082`,
        chalk`    {dim >} expo start --web --port 8082`,
        '',
        chalk`  Run {bold npx expo start --help} for the arguments the Expo CLI accepts.`,
        '',
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx exagent start -h` shows as fast as possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  const { findUpProjectRootOrAssert } =
    require('../utils/findUp') as typeof import('../utils/findUp');
  const { resolveStartPlan } = require('./resolveOptions') as typeof import('./resolveOptions');
  const { startAsync } = require('./startAsync') as typeof import('./startAsync');

  return (async () => {
    const projectRoot = findUpProjectRootOrAssert(process.cwd());
    const exitCode = await startAsync(projectRoot, resolveStartPlan(argv ?? []));
    process.exitCode = exitCode;
  })().catch(logCmdError);
};
