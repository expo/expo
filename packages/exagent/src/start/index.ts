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
        `--plan              Print what must run to get this app on a device, then exit`,
        `--smart             Print that plan, then run it (prebuild and build when needed)`,
        `--json              Print the plan as JSON, for --plan and --smart`,
        `--no-agent-skills   Skip linking agent skills from installed packages`,
        `-h, --help          Usage info`,
      ].join('\n'),
      [
        '',
        chalk`  All other arguments are passed to {bold expo start} in the project.`,
        chalk`    {dim $} npx exagent start --web --port 8082`,
        chalk`    {dim >} expo start --web --port 8082`,
        '',
        chalk`  {bold --plan} and {bold --smart} decide between {bold expo start}, {bold expo prebuild} and`,
        chalk`  {bold expo run:ios}/{bold expo run:android} from the project state. {bold --plan} only reports the`,
        chalk`  decision, so an agent can ask for approval before anything runs.`,
        chalk`    {dim $} npx exagent start --plan --ios`,
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
  const { resolveStartOptions } = require('./resolveOptions') as typeof import('./resolveOptions');

  return (async () => {
    const projectRoot = findUpProjectRootOrAssert(process.cwd());
    const options = resolveStartOptions(argv ?? []);

    if (options.mode === 'default') {
      const { startAsync } = require('./startAsync') as typeof import('./startAsync');
      process.exitCode = await startAsync(projectRoot, options);
      return;
    }

    // The plan engine and the project probe only load for `--plan` and `--smart`, so the
    // default path keeps starting the dev server as fast as it did before.
    const { smartStartAsync } = require('./smartStartAsync') as typeof import('./smartStartAsync');
    process.exitCode = await smartStartAsync(projectRoot, options);
  })().catch(logCmdError);
};
