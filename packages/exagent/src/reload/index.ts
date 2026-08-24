// @ref llp/0005-runtime-loop-tools.rfc.md §Reloading the app
// @ref llp/0010-agent-conventions.rfc.md §The fourth: `reload`
import chalk from 'chalk';

import type { Command } from '../types';
import { assertWithOptionsArgs, DURATION_HELP_NOTE, DURATION_METAVAR, printHelp } from '../utils/args';

export const exagentReload: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    {
      argv,
      // The remaining options are resolved by `resolveReloadOptions`.
      permissive: true,
      command: 'reload',
      // The permissive parse puts unrecognized options into `_`, so this command's own resolver is
      // what rejects a stray argument (llp/0010 §Registry rules, rule d).
      positionalArgs: 'own',
    }
  );

  if (args['--help']) {
    printHelp(
      `Reload the running app, so it runs the code that is on disk now`,
      chalk`npx exagent reload`,
      [
        `--route <route>         Open this route once the app is back`,
        `--method <method>       auto (default), dev-server, or device`,
        `--ios                   Reload the app on the booted iOS simulator`,
        `--android               Reload the app on the attached Android device`,
        `--scheme <scheme>       URL scheme for --route, instead of the one in app.json`,
        `--app-id <id>           Application id to stop, for the device method`,
        `--dev-server-url <url>  Dev server to reload through (default: the project's own)`,
        `--timeout ${DURATION_METAVAR}    How long to wait for the app to come back (default: 30s)`,
        `--json                  Print the result as JSON`,
        `--no-route-check        Open --route without checking it against the project`,
        `--no-followups          Skip the "Suggested next:" section of suggested follow-up commands`,
        `-h, --help              Usage info`,
      ].join('\n'),
      [
        '',
        chalk`  {dim $} npx exagent reload`,
        chalk`  {dim $} npx exagent reload --route /notes`,
        chalk`  {dim $} npx exagent reload --json --timeout 60s`,
        '',
        chalk`  {bold Why this exists.} After a component throws while rendering, the fix on disk does`,
        chalk`  not reach the app on its own. {bold dev:wait} goes green because the bundle compiles,`,
        chalk`  while the app is still running the JavaScript from before the fix — and`,
        chalk`  {bold runtime:errors --fail-on-error} keeps exiting 20 for the error that was removed,`,
        chalk`  because the debugger replays what the app reported to every new connection. Reload`,
        chalk`  before believing any gate that reads the app.`,
        '',
        chalk`  {bold How it reloads.} By default it broadcasts a reload on the dev server's own client`,
        chalk`  command socket — the same thing pressing {bold r} in {bold expo start} does. That needs no`,
        chalk`  simulator tooling and no application id, and works the same on iOS and Android.`,
        chalk`  If no app answers there, it falls back to stopping the app on the device and`,
        chalk`  opening it again. {bold --method} pins one of the two.`,
        '',
        chalk`  {bold What it proves.} A reload is reported only when it was observed: the app's`,
        chalk`  connection to the dev server has to be replaced by a new one, and an app has to be`,
        chalk`  attached again afterwards. {bold reloaded} is never a guess.`,
        '',
        chalk`  Exit codes: {bold 0} reloaded and back, {bold 20} not reloaded, {bold 22} reloaded but not back`,
        chalk`  before {bold --timeout} — inconclusive, so look again rather than assume a failure.`,
        '',
        `  ${DURATION_HELP_NOTE}`,
        '',
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx exagent reload -h` shows as fast as possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  const { findUpProjectRootOrAssert } =
    require('../utils/findUp') as typeof import('../utils/findUp');
  const { resolveReloadOptions } = require('./resolveOptions') as typeof import('./resolveOptions');
  const { reloadAsync } = require('./reloadAsync') as typeof import('./reloadAsync');
  const { EXIT_OK, exitWithCodeAsync } = require('../exitCodes') as typeof import('../exitCodes');

  return (async () => {
    const options = resolveReloadOptions(argv ?? []);
    const projectRoot = findUpProjectRootOrAssert(process.cwd());
    const code = await reloadAsync(projectRoot, options);
    if (code !== EXIT_OK) {
      // An outcome, not an error: the command has already printed everything it has to say, and
      // the code is what the caller branches on (llp/0010 §Exit codes).
      await exitWithCodeAsync(code);
    }
  })().catch(logCmdError);
};
