import { printCommandHelp } from '../help/format';
import type { CommandHelp } from '../help/types';
import { PROGRAM_PREFIX } from '../programName';
import type { Command } from '../types';
import { assertWithOptionsArgs } from '../utils/args';

export const typecheckHelp: CommandHelp = {
  command: 'typecheck',
  usage: `${PROGRAM_PREFIX} typecheck`,
  options: [
    `--json            Print the whole report as JSON, every diagnostic included`,
    `--no-followups    Leave the suggested follow-up commands out of the report`,
    `-h, --help        Usage info`,
  ],
  examples: [
    {
      run: `${PROGRAM_PREFIX} typecheck`,
      gets: 'one line per type error, and exit 20 when there is one',
    },
    {
      run: `${PROGRAM_PREFIX} typecheck --json`,
      gets: 'every diagnostic as data: file, line, column, code, message',
    },
  ],
  next: ['smoke', 'status'],
  json: {
    stdout: 'one object, and nothing else',
    stderr: 'progress and errors',
    keys: [
      'projectRoot',
      'checked',
      'reason',
      'errorCount',
      'errors',
      'durationMs',
      'generatedTypes',
      'followups',
    ],
  },
  notes: [
    `Read-only. It runs the project's own node_modules/.bin/tsc --noEmit and reports its`,
    `diagnostics as data. No compiler is ever fetched: a type check is a function of this`,
    `project's own compiler, tsconfig.json and @types.`,
    `This is the gate the others cannot be — a type error that is neither a syntax error nor a`,
    `throw is invisible to smoke and to runtime:errors, and it is the ordinary case.`,
    `Exit codes: 0 it type-checks · 20 it does not · 1 the compiler is missing or could not run.`,
    `A JavaScript project has nothing to check: that is checked: false with a reason, and exit 0.`,
  ],
};

export const agentCliTypecheck: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      '--json': Boolean,
      '--no-followups': Boolean,
      // Aliases
      '-h': '--help',
    },
    { argv, command: 'typecheck', positionalArgs: 'none' }
  );

  if (args['--help']) {
    printCommandHelp(typecheckHelp);
  }

  // Load modules after the help prompt so `npx @expo/agent-cli typecheck -h` shows as fast as possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  const { exitWithCodeAsync } = require('../exitCodes') as typeof import('../exitCodes');
  const { findUpProjectRootOrAssert } =
    require('../utils/findUp') as typeof import('../utils/findUp');
  const { printTypeCheckAsync } = require('./typecheckAsync') as typeof import('./typecheckAsync');

  return (async () => {
    const projectRoot = findUpProjectRootOrAssert(process.cwd());
    const exitCode = await printTypeCheckAsync(projectRoot, {
      json: !!args['--json'],
      followups: !args['--no-followups'],
    });
    if (exitCode !== 0) {
      await exitWithCodeAsync(exitCode);
    }
  })().catch(logCmdError);
};
