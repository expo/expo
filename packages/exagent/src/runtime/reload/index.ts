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
        `--cloud                 Use this project's EAS Simulator session for the device method`,
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
        chalk`  {bold How it reloads: three mechanisms, in the order of what they cost the app.}`,
        chalk`  {bold dev-server} broadcasts a reload on the dev server's own client command socket — the`,
        chalk`  same thing pressing {bold r} in {bold expo start} does. It needs no simulator tooling and no`,
        chalk`  application id, and works the same on iOS and Android.`,
        chalk`  {bold runtime} asks the app to reload itself: {bold expo.reloadAppAsync()} over the debugger,`,
        chalk`  at the same target {bold runtime:eval} reads. It is here because the two connection lists`,
        chalk`  disagree — an app can be in the dev server's debugger target list and have no client on`,
        chalk`  its command socket, which is what a cloud app over a tunnel is — and this is the only`,
        chalk`  mechanism that reaches one without stopping it.`,
        chalk`  {bold device} force-stops the app and opens it again. It is the only one that can {bold start}`,
        chalk`  an app, and the only one that costs the app's state, so {bold auto} reaches it only when no`,
        chalk`  app is connected at all. {bold --method device} is how to ask for it deliberately.`,
        '',
        chalk`  {bold It never force-stops an app it can see.} With a runtime connected and neither of the`,
        chalk`  first two mechanisms able to reach it, this exits {bold 20} and says so, instead of`,
        chalk`  restarting an app you did not ask it to restart.`,
        '',
        chalk`  {bold --cloud changes only the device method.} Both of the others already reach an EAS`,
        chalk`  Simulator session: the broadcast goes out over this dev server's socket, the debugger`,
        chalk`  call goes to the target the session registered, and a cloud session has to reach this`,
        chalk`  dev server through a tunnel to be running the bundle at all. The flag is for the device`,
        chalk`  method, which becomes the session controller's {bold close} and {bold open} verbs.`,
        '',
        chalk`  {bold What it checks first.} The project's entry bundle, the same way {bold smoke} does. A`,
        chalk`  reload makes the app fetch the served bundle again, so reloading onto a bundle that`,
        chalk`  does not compile puts the app back on the red screen it is already showing. That is`,
        chalk`  exit {bold 20} with the file and line the bundler stopped on. {bold --no-bundle-check} skips it.`,
        '',
        chalk`  {bold What it proves.} A reload is reported only when it was observed: the app's`,
        chalk`  connection to the dev server has to be replaced by a new one, {bold and} a debugger target`,
        chalk`  the dev server had not listed before has to register. The second is what tells an app`,
        chalk`  that came back from one that quit — a reloading app's old target stays listed for`,
        chalk`  about half a second. {bold reloaded} is never a guess.`,
        '',
        chalk`  Exit codes: {bold 0} reloaded and back, {bold 20} not reloaded (or the bundle does not compile),`,
        chalk`  {bold 22} reloaded but not back before {bold --timeout} — inconclusive, so look again rather`,
        chalk`  than assume a failure.`,
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
