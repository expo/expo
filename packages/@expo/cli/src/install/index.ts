#!/usr/bin/env node
import chalk from 'chalk';

import type { Command } from '../index';
import { assertWithOptionsArgs, printHelp } from '../utils/args';

export const expoInstall: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Other options are parsed manually.
      '--help': Boolean,
      '--json': Boolean,
      // Aliases
      '-h': '--help',
    },
    {
      argv,
      // Allow other options, we'll throw an error if unexpected values are passed.
      permissive: true,
    }
  );

  if (args['--help']) {
    printHelp(
      `Install a module or other package to a project`,
      `npx expo install`,
      [
        `--check             Check which installed packages need to be updated`,
        '--dev               Save the dependencies as devDependencies',
        `--fix               Automatically update any invalid package versions`,
        `--no-agent-skills   Skip linking agent skills from the installed packages`,
        `--no-skill-context  Skip printing installed skills for a detected coding agent`,
        chalk`--npm               Use npm to install dependencies. {dim Default when package-lock.json exists}`,
        chalk`--yarn              Use Yarn to install dependencies. {dim Default when yarn.lock exists}`,
        chalk`--bun               Use bun to install dependencies. {dim Default when bun.lock or bun.lockb exists}`,
        chalk`--pnpm              Use pnpm to install dependencies. {dim Default when pnpm-lock.yaml exists}`,
        `-h, --help          Usage info`,
        `--json              Output dependency information in JSON format with --check flag`,
      ].join('\n'),
      [
        '',
        chalk`  Additional options can be passed to the underlying install command by using {bold --}`,
        chalk`    {dim $} npx expo install react -- --verbose`,
        chalk`    {dim >} yarn add react --verbose`,
        '',
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx expo install -h` shows as fast as possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  const { findUpProjectRootOrAssert } =
    require('../utils/findUp') as typeof import('../utils/findUp');
  const { loadEnvFiles } = require('../utils/nodeEnv') as typeof import('../utils/nodeEnv');
  const { resolveArgsAsync } = require('./resolveOptions') as typeof import('./resolveOptions');

  return (async () => {
    const { variadic, options, extras } = await resolveArgsAsync(process.argv.slice(3));
    const projectRoot = findUpProjectRootOrAssert(process.cwd());
    loadEnvFiles(projectRoot, { mode: 'development' });

    const { installAsync } = require('./installAsync') as typeof import('./installAsync');
    return installAsync(variadic, { ...options, projectRoot }, extras);
  })().catch(logCmdError);
};
