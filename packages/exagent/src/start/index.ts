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
      command: 'start',
      // The options and the positional arguments are resolved together, per action,
      // by this command's own `resolve*Options`; a permissive parse cannot tell an
      // unrecognized flag from a positional argument, so it must not judge either.
      positionalArgs: 'own',
    }
  );

  if (args['--help']) {
    printHelp(
      `Start the dev server with "expo start", then sync the agent skills of the project`,
      chalk`npx exagent start {dim [options]}`,
      [
        `--no-agent-skills   Skip linking agent skills from installed packages`,
        `--no-followups      Skip the "Suggested next:" section of suggested follow-up commands`,
        `-h, --help          Usage info`,
      ].join('\n'),
      [
        '',
        chalk`  This command is {bold expo start}: it probes nothing, plans nothing, and forwards every`,
        chalk`  argument it does not own to the Expo CLI untouched, separator included.`,
        chalk`    {dim $} npx exagent start --web --port 8082`,
        chalk`    {dim >} expo start --web --port 8082`,
        chalk`    {dim $} npx exagent start -- --web --port 8082`,
        '',
        chalk`  To decide what must run first — {bold expo prebuild} and {bold expo run:ios}/{bold expo run:android}`,
        chalk`  before the dev server — run {bold npx exagent dev}, which prints that plan and runs it.`,
        chalk`    {dim $} npx exagent dev --plan`,
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

    // @ref llp/0006-agent-native-cli-surface.rfc.md §The `exagent` launcher — a command that
    // shares a name with an `expo` command behaves like it. Neither the probe nor the plan engine
    // is loaded here, so `expo start` is reached as fast as running it directly.
    const { startAsync } = require('./startAsync') as typeof import('./startAsync');
    process.exitCode = await startAsync(projectRoot, options);
  })().catch(logCmdError);
};
