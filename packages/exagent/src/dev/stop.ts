// @ref llp/0005-runtime-loop-tools.rfc.md §Stopping the dev server
// @ref llp/0010-agent-conventions.rfc.md §Exit codes
import chalk from 'chalk';

import type { Command } from '../types';
import { assertWithOptionsArgs, DURATION_HELP_NOTE, DURATION_METAVAR, printHelp } from '../utils/args';

export const exagentDevStop: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    {
      argv,
      // The remaining options are resolved by `resolveDevStopOptions`.
      permissive: true,
      command: 'dev:stop',
      // The permissive parse puts unrecognized options into `_`, so this command's own resolver is
      // what rejects a stray argument (llp/0010 §Registry rules, rule d).
      positionalArgs: 'own',
    }
  );

  if (args['--help']) {
    printHelp(
      `Stop this project's dev server`,
      chalk`npx exagent dev:stop`,
      [
        `--port <port>         Look at this port when no lock answers for the project`,
        `--signal <signal>     SIGTERM (default), SIGINT, or SIGKILL`,
        `--force               Stop a dev server on --port that no lock answers for`,
        `--timeout ${DURATION_METAVAR}  How long to wait for it to go (default: 10s)`,
        `--json                Print the result as JSON`,
        `--no-followups        Skip the "Suggested next:" section of suggested follow-up commands`,
        `-h, --help            Usage info`,
      ].join('\n'),
      [
        '',
        chalk`  {dim $} npx exagent dev:stop`,
        chalk`  {dim $} npx exagent dev:stop --json`,
        chalk`  {dim $} npx exagent dev:stop --port 8081 --force`,
        '',
        chalk`  {bold How it knows what to stop.} While {bold exagent dev} or {bold exagent start} runs a dev`,
        chalk`  server, it holds a lock for the project, and the line that lock answers with names`,
        chalk`  the process holding it. That PID is signalled, and the signal reaches the bundler`,
        chalk`  with it — so there is no port to guess at and no {bold lsof} to compose.`,
        '',
        chalk`  {bold What it will not do.} A port that something is listening on with no lock behind it`,
        chalk`  is a dev server this CLI did not start — most often a second project's. It is`,
        chalk`  reported, with its PID when this machine will name one, and left running. {bold --force}`,
        chalk`  stops it, and only when {bold two} things agree: the port answers as an Expo dev server,`,
        chalk`  and the process on it looks like one. Either alone can be wrong about which process`,
        chalk`  owns the port right now.`,
        '',
        chalk`  Exit codes: {bold 0} stopped, or nothing was running; {bold 20} something is still there.`,
        chalk`  Nothing running is success on purpose — it is the state the caller asked for.`,
        '',
        `  ${DURATION_HELP_NOTE}`,
        '',
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx exagent dev:stop -h` shows as fast as possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  const { findUpProjectRootOrAssert } =
    require('../utils/findUp') as typeof import('../utils/findUp');
  const { resolveDevStopOptions } =
    require('./resolveStopOptions') as typeof import('./resolveStopOptions');
  const { EXIT_OK, exitWithCodeAsync } = require('../exitCodes') as typeof import('../exitCodes');

  return (async () => {
    const options = resolveDevStopOptions(argv ?? []);
    const projectRoot = findUpProjectRootOrAssert(process.cwd());
    const { devStopAsync } = require('./stopAsync') as typeof import('./stopAsync');
    const code = await devStopAsync(projectRoot, options);
    if (code !== EXIT_OK) {
      // An outcome, not an error: the command has already printed everything it has to say, and
      // the code is what the caller branches on (llp/0010 §Exit codes).
      await exitWithCodeAsync(code);
    }
  })().catch(logCmdError);
};
