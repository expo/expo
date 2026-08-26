// @ref llp/0010-agent-conventions.rfc.md §Exit codes
// @ref llp/0012-build-explain.rfc.md
// The `build` group — `build:wait` and `build:explain` — and no `defaultAction` on purpose: the
// registry rule that answers `exagent build --platform ios` with an error is what keeps the bare
// name from silently printing a listing and exiting 0 for a caller that meant `eas build`.
//
// The directory is `src/builds/` and not `src/build/` because the repository's `.gitignore` has
// `/packages/**/build/` for the compiled output, which would have swallowed the source directory
// whole. The command is still `build:wait`.

import chalk from 'chalk';

import type { Command } from '../types';
import {
  assertWithOptionsArgs,
  DURATION_HELP_NOTE,
  DURATION_METAVAR,
  printHelp,
} from '../utils/args';

export const exagentBuildWait: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    {
      argv,
      // The rest is resolved by `resolveBuildWaitOptions`, which reports a bad flag as a
      // CommandError.
      permissive: true,
      command: 'build:wait',
      // The options and the positional arguments are resolved together, per action,
      // by this command's own `resolve*Options`; a permissive parse cannot tell an
      // unrecognized flag from a positional argument, so it must not judge either.
      positionalArgs: 'own',
    }
  );

  if (args['--help']) {
    printHelp(
      `Wait for an EAS cloud build to finish, and exit with what it did`,
      chalk`npx exagent build:wait {dim <build-id> [options]}`,
      [
        `--timeout ${DURATION_METAVAR}   Give up after this long. Default: 45m`,
        `--interval ${DURATION_METAVAR}  How often to poll. Default: 10s, backing off to 30s after 5m`,
        `--submission           <build-id> is a submission id, polled with eas submit:view`,
        `--json                 Print the result as JSON`,
        `--no-followups         Skip the "Suggested next:" section of suggested follow-up commands`,
        `-h, --help             Usage info`,
      ].join('\n'),
      [
        '',
        `  ${DURATION_HELP_NOTE}`,
        '',
        chalk`  {bold Exit codes} — the answer, before a byte of the output is read:`,
        '',
        chalk`     {bold 0}   the build finished`,
        chalk`    {bold 20}   the build errored`,
        chalk`    {bold 21}   the build was canceled, or this wait was interrupted`,
        chalk`    {bold 22}   the timeout expired and the build was still running`,
        chalk`     {bold 7}   nobody is signed in, so no build is visible: a person has to log in`,
        chalk`     {bold 1}   this command could not do its job: bad id, no eas, no answer`,
        '',
        chalk`    {dim $} npx exagent build:wait $BUILD_ID --json || handle_by_code $?`,
        '',
        chalk`  Progress goes to the {bold LOG_EVENTS} JSONL stream as {bold cli:build_wait_poll}, so`,
        chalk`  {bold --json} still prints exactly one object on stdout.`,
        '',
        chalk`  {bold This attaches to an EAS build, which runs in the cloud} — one started by CI, by the`,
        chalk`  dashboard, or by another agent. It needs an Expo account and nothing else: no Xcode,`,
        chalk`  no Android SDK, and no build of any kind on this machine. To start one and wait on it`,
        chalk`  in the same command, use {bold npx eas build --wait}. For a workflow run, use`,
        chalk`  {bold npx eas workflow:status <id> --wait}.`,
        '',
        chalk`  It waits on nothing that runs here. A build on this machine — {bold npx exagent dev},`,
        chalk`  {bold npx expo run:ios} — is a foreground process you already have; there is no id to wait on`,
        chalk`  and no queue it is in.`,
        '',
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx exagent build:wait -h` shows as fast as possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  const { findUpProjectRootOrAssert } =
    require('../utils/findUp') as typeof import('../utils/findUp');
  const { resolveBuildWaitOptions } =
    require('./resolveOptions') as typeof import('./resolveOptions');
  const { buildWaitAsync } = require('./buildWaitAsync') as typeof import('./buildWaitAsync');

  return (async () => {
    const options = resolveBuildWaitOptions(argv ?? []);
    await buildWaitAsync(findUpProjectRootOrAssert(process.cwd()), options);
  })().catch(logCmdError);
};

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
