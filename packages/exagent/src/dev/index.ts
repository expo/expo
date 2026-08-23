import chalk from 'chalk';

import type { Command } from '../types';
import { assertWithOptionsArgs, printHelp } from '../utils/args';

export const exagentDev: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    {
      argv,
      // Every other option belongs to the `expo` CLI and is forwarded to the step that accepts it.
      permissive: true,
    }
  );

  if (args['--help']) {
    printHelp(
      `Get this app onto a device: decide what must run, print the plan, then run it`,
      chalk`npx exagent dev {dim [options]}`,
      [
        `--plan              Print what must run to get this app on a device, then exit`,
        `--yes               Run a plan that builds without asking for confirmation`,
        `--json              Print the plan as JSON, for --plan and for a run`,
        `--ios, --android, --web   Platform to plan for; the host decides when none is named`,
        `--no-agent-skills   Skip linking agent skills from installed packages`,
        `--no-followups      Skip the "Next (optional):" section of suggested follow-up commands`,
        `--no-checkpoint     Skip the git snapshot taken before a plan that prebuilds`,
        `-h, --help          Usage info`,
      ].join('\n'),
      [
        '',
        chalk`  This command decides between {bold expo start}, {bold expo prebuild} and`,
        chalk`  {bold expo run:ios}/{bold expo run:android} from the project state, prints that plan, and runs it.`,
        chalk`  {bold --plan} only reports the decision, so an agent can ask for approval before`,
        chalk`  anything runs. In a terminal, a plan that prebuilds or builds is confirmed once`,
        chalk`  before it starts; {bold --yes} answers that question up front, and a non-interactive`,
        chalk`  run (an agent, or CI) is never asked.`,
        chalk`    {dim $} npx exagent dev`,
        chalk`    {dim $} npx exagent dev --plan --ios`,
        '',
        chalk`  For a dev server that no planning may touch, run {bold npx exagent start}, which is`,
        chalk`  {bold expo start} with every argument forwarded untouched.`,
        chalk`    {dim $} npx exagent start --web --port 8082`,
        '',
        chalk`  Arguments are also passed to the {bold expo start} the plan ends with, when it ends with`,
        chalk`  one. A plan ending in a build reports the arguments it could not pass on.`,
        '',
        chalk`  Run {bold npx expo start --help} for the arguments the Expo CLI accepts.`,
        '',
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx exagent dev -h` shows as fast as possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  const { findUpProjectRootOrAssert } =
    require('../utils/findUp') as typeof import('../utils/findUp');
  const { resolveDevOptions } = require('./resolveOptions') as typeof import('./resolveOptions');

  return (async () => {
    const projectRoot = findUpProjectRootOrAssert(process.cwd());
    const options = resolveDevOptions(argv ?? []);

    // @ref llp/0004-smart-start-and-project-state.rfc.md §`exagent status` — Renamed: the
    // plan-first engine is `exagent dev`, and `exagent start` is the plain `expo start` wrapper.
    const { devAsync } = require('./devAsync') as typeof import('./devAsync');
    process.exitCode = await devAsync(projectRoot, options);
  })().catch(logCmdError);
};
