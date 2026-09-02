// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0010
//
import chalk from 'chalk';

import { PROGRAM_PREFIX } from '../../programName';
import type { Command } from '../../types';
import {
  assertWithOptionsArgs,
  DURATION_HELP_NOTE,
  DURATION_METAVAR,
  printHelp,
} from '../../utils/args';

export const agentCliDevWait: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    {
      argv,
      // The remaining options are resolved by `resolveDevWaitOptions`, which owns their errors.
      permissive: true,
      command: 'dev:wait',
      // The options and the positional arguments are resolved together, per action,
      // by this command's own `resolve*Options`; a permissive parse cannot tell an
      // unrecognized flag from a positional argument, so it must not judge either.
      positionalArgs: 'own',
    }
  );

  if (args['--help']) {
    printHelp(
      `Wait for the dev server, and check that this project's code still compiles`,
      chalk`${PROGRAM_PREFIX} dev:wait {dim [options]}`,
      [
        `--timeout ${DURATION_METAVAR}      How long to wait in total (default: 2m)`,
        `--require-app              Also wait for an app to attach to the dev server`,
        `--platform <ios|android|web>  Platform to build the entry bundle for (default: ios)`,
        `--no-bundle-check          Only wait for the bundler; do not build the entry bundle`,
        `--dev-server-url <url>     Dev server to wait on (default: the project's own, then 8081)`,
        `--port <number>            Dev server on this port, short for --dev-server-url`,
        `--json                     Print the result as JSON`,
        `--no-followups             Skip the "Suggested next:" section of suggested follow-up commands`,
        `-h, --help                 Usage info`,
      ].join('\n'),
      [
        '',
        chalk`  {dim $} ${PROGRAM_PREFIX} dev:wait`,
        chalk`  {dim $} ${PROGRAM_PREFIX} dev:wait --require-app --timeout 60s --json`,
        '',
        `  ${DURATION_HELP_NOTE}`,
        '',
        chalk`  The dev server answers {bold GET /status} only once its bundler has finished, so this`,
        chalk`  command holds one request open rather than polling. It is the gate to put before`,
        chalk`  anything that reads the running app: {bold runtime:eval}, {bold runtime:errors} and`,
        chalk`  {bold navigate} all need a bundle that exists.`,
        '',
        chalk`  {bold /status} only proves the bundler process is alive, so this then asks the dev server`,
        chalk`  for its manifest and builds the entry bundle it names. That is the only part of the`,
        chalk`  check that is about {bold your code}: a dev server can be perfectly healthy while the`,
        chalk`  project it serves has a syntax error in it. A bundle that does not compile is reported`,
        chalk`  with the file, line and message the bundler stopped on. The first build of a cold dev`,
        chalk`  server compiles the whole app and can take tens of seconds, inside {bold --timeout};`,
        chalk`  {bold --no-bundle-check} waits for the bundler and nothing else.`,
        '',
        chalk`  {bold --require-app counts native runtimes only.} What it reads is the dev server's`,
        chalk`  debugger target list, which holds React Native runtimes that attached over the`,
        chalk`  inspector. A browser running the web bundle never registers one, so there is nothing`,
        chalk`  to count for web: {bold --platform web} reports {bold appsConnected: null} with the reason, and`,
        chalk`  {bold --require-app --platform web} is refused rather than answered with a number about`,
        chalk`  iOS or Android.`,
        '',
        chalk`  The dev server also names the project it serves, so this reports whether the server`,
        chalk`  that answered is {bold this} project's — the one thing a port scan cannot prove. A`,
        chalk`  server that proved it serves {bold another} project is a failure, not a pass: pass`,
        chalk`  {bold --dev-server-url} when two projects are running at once.`,
        '',
        chalk`  Exit codes: {bold 0} ready · {bold 22} the wait expired, so try a longer {bold --timeout} ·`,
        chalk`  {bold 20} the entry bundle does not compile, the dev server serves another project, or`,
        chalk`  something answered that is not an Expo dev server · {bold 1} no dev server at all.`,
        '',
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx @expo/agent-cli dev:wait -h` shows as fast as possible.
  const { logCmdError } = require('../../utils/errors') as typeof import('../../utils/errors');
  const { findUpProjectRootOrCwd } =
    require('../../utils/findUp') as typeof import('../../utils/findUp');
  const { EXIT_OK, exitWithCodeAsync } =
    require('../../exitCodes') as typeof import('../../exitCodes');
  const { resolveDevWaitOptions } =
    require('./resolveWaitOptions') as typeof import('./resolveWaitOptions');

  return (async () => {
    const options = resolveDevWaitOptions(argv ?? []);
    // The non-asserting lookup: with `--dev-server-url` this command works against any dev server,
    // so being outside a project is not an error — it only means there is no lock to ask and no
    // project root to compare the dev server's own against.
    const projectRoot = findUpProjectRootOrCwd(process.cwd());

    const { devWaitAsync } = require('./waitAsync') as typeof import('./waitAsync');
    const code = await devWaitAsync(projectRoot, options);
    if (code !== EXIT_OK) {
      // An outcome, not an error: it has already printed everything it has to say, and the code is
      // what the caller branches on (llp/0010 §Exit codes).
      await exitWithCodeAsync(code);
    }
  })().catch(logCmdError);
};
