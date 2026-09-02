// @ref llp/0004-smart-start-and-project-state.rfc.md §Daemonization
// @ref llp/0010-agent-conventions.rfc.md §Exit codes
import { printCommandHelp } from '../help/format';
import type { CommandHelp } from '../help/types';
import { PROGRAM_PREFIX } from '../programName';
import type { Command } from '../types';
import { assertWithOptionsArgs, DURATION_HELP_NOTE, DURATION_METAVAR } from '../utils/args';

export const devStopHelp: CommandHelp = {
  command: 'dev:stop',
  usage: `${PROGRAM_PREFIX} dev:stop`,
  options: [
    `--port <port>         Look at this port when no lock answers for the project`,
    `--signal <signal>     SIGTERM (default), SIGINT, or SIGKILL`,
    `--force               Stop a dev server on --port that no lock answers for`,
    `--timeout ${DURATION_METAVAR}  How long to wait for it to go (default: 10s)`,
    `--json                Print the result as JSON`,
    `--no-followups        Skip the "Suggested next:" section of suggested follow-up commands`,
    `-h, --help            Usage info`,
  ],
  examples: [
    {
      run: `${PROGRAM_PREFIX} dev:stop`,
      gets: 'this project’s dev server is signalled and gone; exit 0 if none was running',
    },
    {
      run: `${PROGRAM_PREFIX} dev:stop --json`,
      gets: 'the same as one object: pid, port, url, stopped',
    },
    {
      run: `${PROGRAM_PREFIX} dev:stop --port 8081 --force`,
      gets: 'stops a dev server on that port that this CLI did not start',
    },
  ],
  next: ['dev', 'status'],
  json: {
    stdout: 'one object, and nothing else',
    stderr: 'progress and errors',
    keys: [
      'stopped',
      'pid',
      'port',
      'url',
      'lockHeld',
      'signal',
      'forced',
      'forceRefusedBy',
      'processStillRunning',
      'portStillAnswering',
      'reason',
      'detail',
      'waitedMs',
      'followups',
    ],
  },
  notes: [
    `${PROGRAM_PREFIX} stop is this same command. It stops the DEV SERVER; stopping the app`,
    `on the device is "${PROGRAM_PREFIX} runtime:stop", which is a different thing to stop.`,
    `It signals the process named by this project's dev-server lock, so there is no port to`,
    `guess at. A port with no lock behind it is another project's server: reported, left alone,`,
    `and stopped only by --force, and only when the port and the process both look like one.`,
    `Exit codes: 0 stopped, or nothing was running · 20 something is still there.`,
    DURATION_HELP_NOTE,
  ],
};

export const agentCliDevStop: Command = async (argv) => {
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
    printCommandHelp(devStopHelp);
  }

  // Load modules after the help prompt so `npx @expo/agent-cli dev:stop -h` shows as fast as possible.
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
