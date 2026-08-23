import chalk from 'chalk';

import type { Command } from '../types';
import { assertWithOptionsArgs, printHelp } from '../utils/args';

export const exagentInstall: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    {
      argv,
      // Every other option belongs to `expo install` and is forwarded untouched.
      permissive: true,
    }
  );

  if (args['--help']) {
    printHelp(
      `Install packages with the Expo CLI and link the skills they ship`,
      chalk`npx exagent install {dim [package...]}`,
      [
        `--no-agent-skills   Skip linking agent skills from the installed packages`,
        `--no-skill-context  Skip printing installed skills for a detected coding agent`,
        `--no-impact         Skip the report of what must rerun after the install`,
        `--no-followups      Skip the "Next (optional):" section of suggested follow-up commands`,
        `--no-checkpoint     Skip the git snapshot taken before the install`,
        `-h, --help          Usage info`,
      ].join('\n'),
      [
        '',
        chalk`  All other arguments are passed to {bold expo install} in the project.`,
        chalk`    {dim $} npx exagent install expo-sqlite --dev`,
        chalk`    {dim >} expo install expo-sqlite --dev`,
        '',
        chalk`  {bold npx exagent add} is the same command, because {bold expo add} is {bold expo install}.`,
        '',
        chalk`  Run {bold npx expo install --help} for the arguments the Expo CLI accepts.`,
        '',
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx exagent install -h` shows as fast as possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  const { findUpProjectRootOrAssert } =
    require('../utils/findUp') as typeof import('../utils/findUp');
  const { resolveInstallPlan } = require('./resolveOptions') as typeof import('./resolveOptions');
  const { installAsync } = require('./installAsync') as typeof import('./installAsync');

  return (async () => {
    const projectRoot = findUpProjectRootOrAssert(process.cwd());
    const exitCode = await installAsync(projectRoot, resolveInstallPlan(argv ?? []));
    process.exitCode = exitCode;
  })().catch(logCmdError);
};
