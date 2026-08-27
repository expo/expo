// @ref llp/0005-runtime-loop-tools.rfc.md §Reloading the app
// @ref llp/0010-agent-conventions.rfc.md §The fourth: `reload`
import chalk from 'chalk';

import type { Command } from '../../types';
import { assertWithOptionsArgs, DURATION_HELP_NOTE, DURATION_METAVAR, printHelp } from '../../utils/args';

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
      command: 'runtime:reload',
      // The permissive parse puts unrecognized options into `_`, so this command's own resolver is
      // what rejects a stray argument (llp/0010 §Registry rules, rule d).
      positionalArgs: 'own',
    }
  );

  if (args['--help']) {
    printHelp(
      `Reload the running app, so it runs the code that is on disk now`,
      chalk`npx exagent runtime:reload`,
      [
        `--route <route>         Open this route once the app is back`,
        `--method <method>       auto (default), dev-server, runtime, or device`,
        `--ios, --platform ios   Reload the app on the booted iOS simulator`,
        `--android               Reload the app on the attached Android device`,
        `--cloud                 Reload the app on this project's EAS Simulator session`,
        `--scheme <scheme>       URL scheme for --route, instead of the one in app.json`,
        `--app-id <id>           Application id to stop, for the device method`,
        `--dev-server-url <url>  Dev server to reload through (default: the project's own)`,
        `--port <number>         Dev server on this port, short for --dev-server-url`,
        `--timeout ${DURATION_METAVAR}    How long to wait for the app to come back (default: 30s)`,
        `--json                  Print the result as JSON`,
        `--no-bundle-check       Reload without building the entry bundle first`,
        `--no-route-check        Open --route without checking it against the project`,
        `--no-followups          Skip the "Suggested next:" section of suggested follow-up commands`,
        `-h, --help              Usage info`,
      ].join('\n'),
      [
        '',
        chalk`  {dim $} npx exagent runtime:reload`,
        chalk`  {dim $} npx exagent runtime:reload --route /notes`,
        chalk`  {dim $} npx exagent runtime:reload --json --timeout 60s`,
        '',
        chalk`  {bold Why this exists.} After a component throws while rendering, the fix on disk does`,
        chalk`  not reach the app on its own. A bundle check goes green because the bundle compiles,`,
        chalk`  while the app is still running the JavaScript from before the fix — and`,
        chalk`  {bold runtime:errors --fail-on-error} keeps exiting 20 for the error that was removed,`,
        chalk`  because the debugger replays what the app reported to every new connection. Reload`,
        chalk`  before believing any gate that reads the app.`,
        '',
        chalk`  {bold One ladder, and the command socket picks the rung.}`,
        chalk`  {bold 1. dev-server} broadcasts a reload on the dev server's own client command socket — the`,
        chalk`  same thing pressing {bold r} in {bold expo start} does. It needs no simulator tooling and no`,
        chalk`  application id, works the same on iOS and Android, and costs the app nothing. This is`,
        chalk`  the rung whenever that socket holds a client, which is what {bold getpeers} answers.`,
        chalk`  {bold 2. device} relaunches the app: it stops it and opens it again. This is the rung when`,
        chalk`  the socket holds no client — an app can be in the dev server's debugger target list and`,
        chalk`  hold nothing on that socket, which is what an app over a tunnel is, and a broadcast`,
        chalk`  there reaches nobody. It is also what {bold starts} an app that is not running at all.`,
        chalk`  It costs the app's JavaScript state, and the report says so on the attempt.`,
        chalk`  {bold runtime} asks the app to reload itself, and {bold auto} never picks it — see below.`,
        '',
        chalk`  {bold The rung is the socket, not the location.} {bold --cloud} names which device backend may`,
        chalk`  relaunch — this project's EAS Simulator session instead of a device booted here — and`,
        chalk`  changes nothing else about the ladder. {bold --method} pins one rung and skips the rest.`,
        '',
        chalk`  {bold What proves it is the same on every rung:} a debugger target the dev server had not`,
        chalk`  listed before, {bold or} a {bold Bundled} line in its captured output that was not there before.`,
        chalk`  Neither is available on every app, and a run with neither is exit {bold 22} — the mechanism`,
        chalk`  ran and nothing was observed, which is "look again" rather than "it failed".`,
        '',
        chalk`  {bold --method runtime, and why it is opt-in.} It asks the app to reload itself —`,
        chalk`  {bold expo.reloadAppAsync()} over the debugger, at the same target {bold runtime:eval} reads —`,
        chalk`  which is the one way to reach an app that is in the dev server's target list and has no`,
        chalk`  client on its command socket, as a cloud app over a tunnel is.`,
        chalk`  {bold On Expo Go the same call closes the app} instead of reloading it, and nothing`,
        chalk`  re-registers [observed — SDK 57, iOS simulator]. One runtime reloads and another`,
        chalk`  quits, so this is a method you choose rather than one this command runs for you.`,
        '',
        chalk`  {bold --cloud relaunches on the session.} A cloud simulator has never been seen to hold a`,
        chalk`  client on this dev server's command socket — the tunnel carries the {bold bundle}, over`,
        chalk`  HTTP — so the ladder lands on rung 2 there, and the flag says which backend runs it:`,
        chalk`  two controller verbs, {bold open <app-id> --relaunch} and then {bold open <url>}, which restart`,
        chalk`  the app and deep-link the route into it. It needs a tunnelled dev server —`,
        chalk`  {bold dev --detach --tunnel} — and it refuses before touching the app when the dev server is`,
        chalk`  only reachable from here.`,
        '',
        chalk`  {bold What it checks first.} The project's entry bundle, the same way {bold smoke} does. A`,
        chalk`  reload makes the app fetch the served bundle again, so reloading onto a bundle that`,
        chalk`  does not compile puts the app back on the red screen it is already showing. That is`,
        chalk`  exit {bold 20} with the file and line the bundler stopped on. {bold --no-bundle-check} skips it.`,
        '',
        chalk`  {bold What it proves.} A reload is reported only when it was observed. A debugger target`,
        chalk`  the dev server had not listed before is the stronger observation, and it is what tells`,
        chalk`  an app that came back from one that quit — a reloading app's old target stays listed for`,
        chalk`  about half a second. {bold reloaded} is never a guess.`,
        chalk`  The other observation is the dev server's own: a {bold Bundled} line in its captured output`,
        chalk`  that was not there before, which means something fetched the served bundle again. That`,
        chalk`  is the only one a cloud session leaves — a simulator there registers no debugger target`,
        chalk`  — and it is also what proves a relaunch of an app that comes back under the page id it`,
        chalk`  had before. Start the dev server with {bold dev --detach} so there is output to read;`,
        chalk`  without it a relaunch can only report that the mechanism ran.`,
        '',
        chalk`  Exit codes: {bold 0} reloaded and observed, {bold 20} no rung reloaded it (or the bundle does`,
        chalk`  not compile), {bold 22} a mechanism ran and nothing was observed before {bold --timeout} —`,
        chalk`  inconclusive, so look again rather than assume a failure. {bold 1} means there was no dev`,
        chalk`  server to reload onto: nothing was attempted.`,
        '',
        `  ${DURATION_HELP_NOTE}`,
        '',
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx exagent runtime:reload -h` shows as fast as possible.
  const { logCmdError } = require('../../utils/errors') as typeof import('../../utils/errors');
  const { findUpProjectRootOrAssert } =
    require('../../utils/findUp') as typeof import('../../utils/findUp');
  const { resolveReloadOptions } = require('./resolveOptions') as typeof import('./resolveOptions');
  const { reloadAsync } = require('./reloadAsync') as typeof import('./reloadAsync');
  const { EXIT_OK, exitWithCodeAsync } = require('../../exitCodes') as typeof import('../../exitCodes');

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
