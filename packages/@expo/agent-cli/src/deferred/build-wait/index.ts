// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0010
//
// @ref llp/0010-agent-conventions.rfc.md §Exit codes
// The `@expo/agent-cli build:wait` command, lifted out of `src/builds/index.ts` when it left the v1
// surface. It shared that module with `build:explain`, which stayed and was then renamed to
// `inspect:build-log`; nothing else moved with this.

import chalk from 'chalk';

import { PROGRAM_PREFIX } from '../../programName';
import type { Command } from '../../types';
import {
  assertWithOptionsArgs,
  DURATION_HELP_NOTE,
  DURATION_METAVAR,
  printHelp,
} from '../../utils/args';

export const agentCliBuildWait: Command = async (argv) => {
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
      chalk`${PROGRAM_PREFIX} build:wait {dim <build-id> [options]}`,
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
        chalk`    {dim $} ${PROGRAM_PREFIX} build:wait $BUILD_ID --json || handle_by_code $?`,
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
        chalk`  It waits on nothing that runs here. A build on this machine — {bold ${PROGRAM_PREFIX} dev},`,
        chalk`  {bold npx expo run:ios} — is a foreground process you already have; there is no id to wait on`,
        chalk`  and no queue it is in.`,
        '',
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx @expo/agent-cli build:wait -h` shows as fast as possible.
  const { logCmdError } = require('../../utils/errors') as typeof import('../../utils/errors');
  const { findUpProjectRootOrAssert } =
    require('../../utils/findUp') as typeof import('../../utils/findUp');
  const { resolveBuildWaitOptions } =
    require('./resolveOptions') as typeof import('./resolveOptions');
  const { buildWaitAsync } = require('./buildWaitAsync') as typeof import('./buildWaitAsync');

  return (async () => {
    const options = resolveBuildWaitOptions(argv ?? []);
    await buildWaitAsync(findUpProjectRootOrAssert(process.cwd()), options);
  })().catch(logCmdError);
};
