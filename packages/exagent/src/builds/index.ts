// @ref llp/0012-build-explain.rfc.md
// The `build` group — `build:explain` since the v1 narrowing deferred `build:wait` (llp/0016) — and
// no `defaultAction` on purpose: the registry rule that answers `exagent build --platform ios` with
// an error is what keeps the bare name from silently printing a listing and exiting 0 for a caller
// that meant `eas build`.
//
// The directory is `src/builds/` and not `src/build/` because the repository's `.gitignore` has
// `/packages/**/build/` for the compiled output, which would have swallowed the source directory
// whole.

import chalk from 'chalk';

import type { Command } from '../types';
import { assertWithOptionsArgs, printHelp } from '../utils/args';

export const exagentBuildExplain: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    {
      argv,
      // The rest is resolved by `resolveExplainOptions`, which reports a bad flag as a
      // CommandError.
      permissive: true,
      command: 'build:explain',
      // The build-id positional is reserved rather than rejected here: `resolveExplainOptions`
      // owns the message that says why it does not work yet and what does.
      positionalArgs: 'own',
    }
  );

  if (args['--help']) {
    printHelp(
      `Read a build log and say what failed in it`,
      chalk`npx exagent build:explain {dim --file <path> | --stdin [options]}`,
      [
        `--file <path>          Read the log from this file`,
        `--stdin                Read the log from stdin. Implied when stdin is not a terminal`,
        `--platform ios|android Narrow the rules to one platform's phases`,
        `--context <n[:m]>      Lines of context around the match. Default: 8 before, 20 after`,
        `--all                  Report every match, not only the failing phase's first`,
        `--json                 Print the report as JSON`,
        `--no-followups         Skip the "Suggested next:" section of suggested follow-up commands`,
        `-h, --help             Usage info`,
      ].join('\n'),
      [
        '',
        chalk`  Deterministic extraction, not summarization: a capped table of rules that ship in`,
        chalk`  this repository, each with a fixture and a test. Every answer carries the line it`,
        chalk`  came from, so nothing has to be taken on trust.`,
        '',
        chalk`    {dim $} npx expo run:ios 2>&1 | npx exagent build:explain --json`,
        chalk`    {dim $} npx exagent build:explain --file ~/Downloads/xcodebuild.log`,
        '',
        chalk`  {bold Exit codes}:`,
        '',
        chalk`     {bold 0}   a report was produced — including "no error located", which is a report`,
        chalk`     {bold 1}   no report could be produced: unreadable file, empty log, bad flag`,
        '',
        chalk`  {bold npx exagent build:explain <build-id>} is reserved and does not work yet: eas-cli`,
        chalk`  has no {bold build:logs} command, so an EAS build's log has to be saved and passed in`,
        chalk`  with {bold --file}. {bold npx eas build:view <id>} prints where the log files are.`,
        '',
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx exagent build:explain -h` shows as fast as possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  const { resolveExplainOptions } =
    require('./explain/resolveOptions') as typeof import('./explain/resolveOptions');
  const { explainAsync } =
    require('./explain/explainAsync') as typeof import('./explain/explainAsync');

  return (async () => {
    const options = resolveExplainOptions(argv ?? [], {
      stdinIsTTY: !!process.stdin.isTTY,
      cwd: process.cwd(),
    });
    await explainAsync(options);
  })().catch(logCmdError);
};
