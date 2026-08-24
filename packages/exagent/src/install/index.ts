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
      command: 'install',
      // The options and the positional arguments are resolved together, per action,
      // by this command's own `resolve*Options`; a permissive parse cannot tell an
      // unrecognized flag from a positional argument, so it must not judge either.
      positionalArgs: 'own',
    }
  );

  if (args['--help']) {
    printHelp(
      `Install packages with the Expo CLI and link the skills they ship`,
      chalk`npx exagent install {dim [package...]}`,
      [
        `--check             Report which installed packages are out of date, and install nothing`,
        `--json              Print the result as JSON`,
        `--no-agent-skills   Skip linking agent skills from the installed packages`,
        `--no-skill-context  Skip printing installed skills for a detected coding agent`,
        `--no-impact         Skip the report of what must rerun after the install`,
        `--no-followups      Skip the "Suggested next:" section of suggested follow-up commands`,
        `--no-checkpoint     Skip the git snapshot taken before the install`,
        `-h, --help          Usage info`,
      ].join('\n'),
      [
        '',
        chalk`  The {bold expo install} flags are passed to the project's Expo CLI:`,
        chalk`  {bold --check}, {bold --dev}, {bold --fix}, {bold --npm}, {bold --pnpm}, {bold --yarn}, {bold --bun}.`,
        chalk`    {dim $} npx exagent install expo-sqlite --dev`,
        chalk`    {dim >} expo install expo-sqlite --dev`,
        '',
        chalk`  Anything after a {bold --} separator goes to the package manager untouched.`,
        chalk`    {dim $} npx exagent install react {bold --} --verbose`,
        '',
        chalk`  {bold --json} prints one object: the packages, whether they were installed, the`,
        chalk`  impact classification, the checkpoint that was taken, which packages ship agent`,
        chalk`  skills, and the follow-ups. Nothing else is written to stdout in that mode.`,
        '',
        chalk`  With {bold --check}, the {bold check} key carries the verdict: {bold ok}, the Expo CLI's own`,
        chalk`  report under {bold report}, what it printed instead under {bold output} when it stopped before`,
        chalk`  producing one, and {bold notes} for anything this CLI can add — a package that is in no`,
        chalk`  {bold package.json} at all, or one that is in it and not in {bold node_modules}.`,
        '',
        chalk`  {bold npx exagent add} is the same command, because {bold expo add} is {bold expo install}.`,
        '',
        chalk`  Run {bold npx expo install --help} for what those forwarded arguments do.`,
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
