// @ref llp/0010-agent-conventions.rfc.md §Exit codes
// The `build` group. One action so far — `build:wait` — and no `defaultAction` on purpose: the
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
    }
  );

  if (args['--help']) {
    printHelp(
      `Wait for an EAS build to finish, and exit with what it did`,
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
        chalk`     {bold 1}   this command could not do its job: bad id, no eas, not signed in`,
        '',
        chalk`    {dim $} npx exagent build:wait $BUILD_ID --json || handle_by_code $?`,
        '',
        chalk`  Progress goes to the {bold LOG_EVENTS} JSONL stream as {bold cli:build_wait_poll}, so`,
        chalk`  {bold --json} still prints exactly one object on stdout.`,
        '',
        chalk`  This attaches to a build that already exists — one started by CI, by the dashboard,`,
        chalk`  or by another agent. To start one and wait on it in the same command, use`,
        chalk`  {bold npx eas build --wait}. For a workflow run, use {bold npx eas workflow:status <id> --wait}.`,
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
