import { printCommandHelp } from '../help/format';
import type { CommandHelp } from '../help/types';
import { PROGRAM_PREFIX } from '../programName';
import type { Command } from '../types';
import { assertWithOptionsArgs } from '../utils/args';

export const doctorCheckHelp: CommandHelp = {
  command: 'doctor:check',
  usage: `${PROGRAM_PREFIX} doctor:check`,
  options: [
    `--json            Print the whole report as JSON, expo-doctor's full text included`,
    `--no-followups    Leave the suggested follow-up commands out of the report`,
    `-h, --help        Usage info`,
  ],
  examples: [
    {
      run: `${PROGRAM_PREFIX} doctor`,
      gets: 'the failed checks and the advice each gave; exit 20 when any failed',
    },
    {
      run: `${PROGRAM_PREFIX} doctor:check --json`,
      gets: 'the same as one object, with everything expo-doctor printed under raw',
    },
  ],
  next: ['status', 'install', 'dev'],
  json: {
    stdout: 'one object, and nothing else',
    stderr: 'progress and errors',
    keys: ['passed', 'failed', 'checks', 'parse', 'projectRoot', 'exitCode', 'raw', 'followups'],
  },
  notes: [
    `Read-only: it runs expo-doctor --verbose as a subprocess and normalizes what it printed.`,
    `Exit codes: 0 every check passed · 20 a check failed · 1 expo-doctor could not be run.`,
    `expo-doctor has no --json, so the report is read back out of its prose. The parse field`,
    `says how well that went (full, best-effort, failed) and raw holds the original text.`,
  ],
};

export const agentCliDoctorCheck: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      '--json': Boolean,
      '--no-followups': Boolean,
      // Aliases
      '-h': '--help',
    },
    { argv, command: 'doctor:check', positionalArgs: 'none' }
  );

  if (args['--help']) {
    printCommandHelp(doctorCheckHelp);
  }

  // Load modules after the help prompt so `npx @expo/agent-cli doctor:check -h` shows as fast as possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  const { exitWithCodeAsync } = require('../exitCodes') as typeof import('../exitCodes');
  // @ref llp/0004-smart-start-and-project-state.rfc.md §Not an Expo app — this command acts on the app, so it stops in a
  // directory that holds no app rather than planning work against whatever is there.
  const { findUpExpoAppRootOrAssert } =
    require('../project/expoApp') as typeof import('../project/expoApp');
  const { printDoctorCheckAsync } = require('./doctorAsync') as typeof import('./doctorAsync');

  return (async () => {
    const projectRoot = findUpExpoAppRootOrAssert(process.cwd());
    const exitCode = await printDoctorCheckAsync(projectRoot, {
      json: !!args['--json'],
      followups: !args['--no-followups'],
    });
    if (exitCode !== 0) {
      await exitWithCodeAsync(exitCode);
    }
  })().catch(logCmdError);
};
