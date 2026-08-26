import chalk from 'chalk';

import type { Command } from '../types';
import { assertWithOptionsArgs, printHelp } from '../utils/args';

export const exagentTypecheck: Command = async (argv) => {
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
    printHelp(
      `Type-check this project with its own TypeScript compiler`,
      chalk`npx exagent typecheck {dim [options]}`,
      [
        `--json            Print the whole report as JSON, every diagnostic included`,
        `--no-followups    Leave the suggested follow-up commands out of the report`,
        `-h, --help        Usage info`,
      ].join('\n'),
      [
        '',
        chalk`  Read-only. It runs the project's own {bold node_modules/.bin/tsc --noEmit --pretty false}`,
        chalk`  as a subprocess and reports its diagnostics as data: {bold file}, {bold line}, {bold column}, {bold code}`,
        chalk`  and {bold message}, one entry each.`,
        '',
        chalk`  This is the gate the other ones cannot be. {bold dev:wait} says the entry bundle compiles`,
        chalk`  and {bold runtime:errors} says what the running app threw — a type error that is neither a`,
        chalk`  syntax error nor a throw is invisible to both, and it is the ordinary case: a property`,
        chalk`  that does not exist is {bold undefined} at runtime, so the app renders, wrongly.`,
        '',
        chalk`  Exit codes: {bold 0} the project type-checks, {bold 20} it does not, {bold 1} the compiler could`,
        chalk`  not be run, is missing, or failed without reporting anything.`,
        '',
        chalk`  A {bold JavaScript} project — no {bold tsconfig.json} and no {bold .ts}/{bold .tsx} files — has nothing to`,
        chalk`  check. That is reported as {bold checked: false} with a reason, and exits {bold 0}: a gate that`,
        chalk`  went red for the absence of TypeScript would be red for every JavaScript project`,
        chalk`  forever.`,
        '',
        chalk`  A {bold TypeScript} project with no compiler is a different answer, and it exits {bold 1}. A`,
        chalk`  {bold tsconfig.json} with no {bold node_modules/.bin/tsc} behind it is a broken setup, not a`,
        chalk`  project with nothing to check, and reporting it as the latter passes every gate that`,
        chalk`  reads the exit code. Install the dependencies, or add the compiler:`,
        chalk`    {dim $} npx exagent install typescript --dev`,
        '',
        chalk`  No compiler is ever fetched. A type check is a function of the project's own compiler`,
        chalk`  version, its {bold tsconfig.json} and its {bold @types}, so one from the registry would answer`,
        chalk`  a question about a project that does not exist.`,
        '',
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx exagent typecheck -h` shows as fast as possible.
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
