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
      `Get this app onto a device: decide what must run, print the plan, then run it`,
      chalk`npx exagent start {dim [options]}`,
      [
        `--plan              Print what must run to get this app on a device, then exit`,
        `--smart             Print the plan, then run it: the default, kept as an alias`,
        `--passthrough       Forward everything to "expo start" instead, without planning`,
        `--yes               Run a plan that builds without asking for confirmation`,
        `--json              Print the plan as JSON, for --plan and the default`,
        `--no-agent-skills   Skip linking agent skills from installed packages`,
        `--no-followups      Skip the "Next:" section of suggested follow-up commands`,
        `--no-checkpoint     Skip the git snapshot taken before a plan that prebuilds`,
        `-h, --help          Usage info`,
      ].join('\n'),
      [
        '',
        chalk`  By default this command decides between {bold expo start}, {bold expo prebuild} and`,
        chalk`  {bold expo run:ios}/{bold expo run:android} from the project state, prints that plan, and runs it.`,
        chalk`  {bold --plan} only reports the decision, so an agent can ask for approval before`,
        chalk`  anything runs. In a terminal, a plan that prebuilds or builds is confirmed once`,
        chalk`  before it starts; {bold --yes} answers that question up front, and a non-interactive`,
        chalk`  run (an agent, or CI) is never asked.`,
        chalk`    {dim $} npx exagent start`,
        chalk`    {dim $} npx exagent start --plan --ios`,
        '',
        chalk`  {bold --passthrough} runs {bold expo start} and nothing else, for a dev server that no`,
        chalk`  planning may touch. Every other argument is passed to it untouched.`,
        chalk`    {dim $} npx exagent start --passthrough --web --port 8082`,
        chalk`    {dim >} expo start --web --port 8082`,
        chalk`    {dim $} npx exagent start --passthrough -- --web --port 8082`,
        '',
        chalk`  Arguments are also passed to the {bold expo start} the plan ends with, when it ends with`,
        chalk`  one. A plan ending in a build reports the arguments it could not pass on.`,
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

    if (options.mode === 'passthrough') {
      // The plain wrapper loads neither the probe nor the plan engine, so `--passthrough` reaches
      // `expo start` as fast as it did when it was this command's default.
      const { startAsync } = require('./startAsync') as typeof import('./startAsync');
      process.exitCode = await startAsync(projectRoot, options);
      return;
    }

    // @ref llp/0004-smart-start-and-project-state.rfc.md §`exagent status` — Default change:
    // planning is what `exagent start` does, and `--passthrough` above is the way out of it.
    const { smartStartAsync } = require('./smartStartAsync') as typeof import('./smartStartAsync');
    process.exitCode = await smartStartAsync(projectRoot, options);
  })().catch(logCmdError);
};
