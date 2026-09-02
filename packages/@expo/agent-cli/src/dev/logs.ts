// @ref llp/0004-smart-start-and-project-state.rfc.md §Daemonization
import { printCommandHelp } from '../help/format';
import type { CommandHelp } from '../help/types';
import { PROGRAM_PREFIX } from '../programName';
import type { Command } from '../types';
import { assertWithOptionsArgs } from '../utils/args';

export const devLogsHelp: CommandHelp = {
  command: 'dev:logs',
  usage: `${PROGRAM_PREFIX} dev:logs`,
  options: [
    `--tail <lines>    How many lines from the end to print (default: 100)`,
    `--json            Print the read as JSON: the file, the lines, and the dev server`,
    `--no-followups    Skip the "Suggested next:" section of suggested follow-up commands`,
    `-h, --help        Usage info`,
  ],
  examples: [
    {
      run: `${PROGRAM_PREFIX} dev:logs`,
      gets: 'the last 100 lines the detached dev server printed, escape codes stripped',
    },
    { run: `${PROGRAM_PREFIX} dev:logs --tail 30 --json`, gets: 'the same 30 lines as one object' },
  ],
  next: ['dev', 'runtime:errors', 'dev:stop'],
  json: {
    stdout: 'one object, and nothing else',
    stderr: 'progress and errors',
    keys: ['logFile', 'lines', 'totalLines', 'truncated', 'devServer', 'advertised', 'followups'],
  },
  notes: [
    `The counterpart of "${PROGRAM_PREFIX} dev --detach", which writes to .expo/dev/logs/ instead of`,
    `to a terminal. A dev server started without --detach has no log, and this says so.`,
    `There is no --follow: a stream with no end is what --detach exists to avoid. Run it again.`,
    `The lines are fenced as untrusted content — a bundler quotes code this CLI did not write.`,
    `Exit codes: 0 the log was read · 1 this project has no detached dev server log.`,
  ],
};

export const agentCliDevLogs: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    {
      argv,
      // The remaining options are resolved by `resolveDevLogsOptions`, which owns their errors.
      permissive: true,
      command: 'dev:logs',
      // The permissive parse puts unrecognized options into `_`, so this command's own resolver is
      // what rejects a stray argument (llp/0010 §Registry rules, rule d).
      positionalArgs: 'own',
    }
  );

  if (args['--help']) {
    printCommandHelp(devLogsHelp);
  }

  // Load modules after the help prompt so `npx @expo/agent-cli dev:logs -h` shows as fast as possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  const { findUpProjectRootOrAssert } =
    require('../utils/findUp') as typeof import('../utils/findUp');
  const { resolveDevLogsOptions } =
    require('./resolveLogsOptions') as typeof import('./resolveLogsOptions');

  return (async () => {
    const options = resolveDevLogsOptions(argv ?? []);
    // Asserting: the log lives inside the project, so there is no reading one from outside.
    const projectRoot = findUpProjectRootOrAssert(process.cwd());

    const { devLogsAsync } = require('./logsAsync') as typeof import('./logsAsync');
    process.exitCode = await devLogsAsync(projectRoot, options);
  })().catch(logCmdError);
};
