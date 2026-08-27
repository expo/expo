// @ref llp/0012-build-explain.rfc.md
// `exagent inspect:build-log`, which the v1 narrowing renamed from `build:explain` (llp/0016): the
// `build` group it was in held one command that started nothing and one that waited on a build
// somebody else started, and `inspect` is the group named after what the caller is actually doing.
// The bare `build` verb is now a name this CLI does not have, answered by the absent-capability
// table in `src/commandRegistry.ts` with `npx eas build`.
//
// The directory is still `src/builds/` and not `src/inspect/`: it is what llp/0012 and the rule
// fixtures name throughout, and moving it would rewrite a hundred references to say nothing new.
// (`src/build/` was never available — the repository's `.gitignore` has `/packages/**/build/`.)

import chalk from 'chalk';

import type { Command } from '../types';
import { assertWithOptionsArgs, printHelp } from '../utils/args';

export const exagentInspectBuildLog: Command = async (argv) => {
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
      command: 'inspect:build-log',
      // The build-id positional is reserved rather than rejected here: `resolveExplainOptions`
      // owns the message that says why it does not work yet and what does.
      positionalArgs: 'own',
    }
  );

  if (args['--help']) {
    printHelp(
      `Read a build log and say what failed in it`,
      chalk`npx exagent inspect:build-log {dim --file <path> | --stdin [options]}`,
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
        chalk`    {dim $} npx expo run:ios 2>&1 | npx exagent inspect:build-log --json`,
        chalk`    {dim $} npx exagent inspect:build-log --file ~/Downloads/xcodebuild.log`,
        '',
        chalk`  {bold Exit codes}:`,
        '',
        chalk`     {bold 0}   a report was produced — including "no error located", which is a report`,
        chalk`     {bold 1}   no report could be produced: unreadable file, empty log, bad flag`,
        chalk`     {bold 22}  what arrived is not a log: binary, most often one still compressed`,
        '',
        chalk`  {bold It refuses input that is not text.} EAS serves a build log brotli-encoded, so a`,
        chalk`  response saved without decoding it is binary — and "no error located" for binary reads`,
        chalk`  as a build that passed. Decode it first: {bold brotli --decompress}, or fetch with`,
        chalk`  {bold curl --compressed}.`,
        '',
        chalk`  {bold npx exagent inspect:build-log <build-id>} is reserved and does not work yet: eas-cli`,
        chalk`  has no {bold build:logs} command, so an EAS build's log has to be saved and passed in`,
        chalk`  with {bold --file}. {bold npx eas build:view <id>} prints where the log files are.`,
        '',
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx exagent inspect:build-log -h` shows as fast as possible.
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
