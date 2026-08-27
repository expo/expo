// @ref llp/0005-runtime-loop-tools.rfc.md §Stopping the app
import chalk from 'chalk';

import type { Command } from '../types';
import { assertWithOptionsArgs, printHelp } from '../utils/args';

export const exagentRuntimeStop: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    {
      argv,
      // The remaining options are resolved by `resolveRuntimeStopOptions`.
      permissive: true,
      command: 'runtime:stop',
      // The permissive parse puts unrecognized options into `_`, so this command's own resolver is
      // what rejects a stray argument (llp/0010 §Registry rules, rule d).
      positionalArgs: 'own',
    }
  );

  if (args['--help']) {
    printHelp(
      `Stop the app on the device it is running on`,
      chalk`npx exagent runtime:stop`,
      [
        `--ios, --platform ios   Stop the app on the booted iOS simulator`,
        `--android               Stop the app on the attached Android device`,
        `--cloud                 Stop the app on this project's EAS Simulator session`,
        `--app-id <id>           Application id to stop, instead of the one this works out`,
        `--dev-server-url <url>  Dev server to ask which app is running (default: the project's own)`,
        `--port <number>         Dev server on this port, short for --dev-server-url`,
        `--json                  Print the result as JSON`,
        `--no-followups          Skip the "Suggested next:" section of suggested follow-up commands`,
        `-h, --help              Usage info`,
      ].join('\n'),
      [
        '',
        chalk`  {dim $} npx exagent runtime:stop`,
        chalk`  {dim $} npx exagent runtime:stop --ios --json`,
        chalk`  {dim $} npx exagent runtime:stop --app-id com.example.myapp`,
        '',
        chalk`  The counterpart of {bold navigate}, which starts the app. Between them an agent can put`,
        chalk`  the app into a known state without composing a {bold simctl} or {bold adb} line.`,
        '',
        chalk`  {bold Which app.} The hard part is not the command, it is the name: Expo Go and a`,
        chalk`  development build are different applications, and a project moves between them.`,
        chalk`  The evidence is ranked — {bold --app-id}, then the app actually connected to the dev`,
        chalk`  server, then {bold ios.bundleIdentifier} / {bold android.package} from the app config, then`,
        chalk`  Expo Go. The report names which of those it used, so a wrong stop is diagnosable.`,
        chalk`  The dev server outranks the config because the config says what a {bold build} of this`,
        chalk`  project would be called, and the dev server says what is running right now.`,
        '',
        chalk`  {bold --cloud stops the app, never the session.} It sends the session controller's`,
        chalk`  {bold close <app-id>} verb, which is the same act as {bold simctl terminate} — the remote`,
        chalk`  machine stays up and keeps billing. To end the session itself, and its billing, run`,
        chalk`  {bold npx eas simulator:stop}. The flag is never taken on its own: a run with no local`,
        chalk`  device says it has none rather than quietly reaching for a paid one.`,
        '',
        chalk`  An app that was not running is a success with a note, not a failure: the state the`,
        chalk`  caller asked for is the state it is in. {bold wasRunning} in {bold --json} says which it was.`,
        '',
        chalk`  {bold The one runtime command that needs no dev server.} The rest of the family refuses`,
        chalk`  when nothing is connected — there is nothing to read or drive — and this one acts on a`,
        chalk`  {bold device}, so a dev server that is down only costs it the best evidence for which app`,
        chalk`  to name. What it does need is a device: with none, it says so and names how to look`,
        chalk`  ({bold xcrun simctl list devices booted}, {bold adb devices}).`,
        '',
        chalk`  {bold The one exception is exit 20:} {bold --app-id} named an app that was not running {bold and}`,
        chalk`  the dev server is reporting a different app that is. Nothing was stopped, and the app`,
        chalk`  on the device is untouched — a typo in the id looks exactly like this. The error`,
        chalk`  names the connected id and the same command aimed at it.`,
        '',
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx exagent runtime:stop -h` shows as fast as possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  const { findUpProjectRootOrAssert } =
    require('../utils/findUp') as typeof import('../utils/findUp');
  const { resolveRuntimeStopOptions } =
    require('./resolveStopOptions') as typeof import('./resolveStopOptions');
  const { runtimeStopAsync } = require('./stopAsync') as typeof import('./stopAsync');

  return (async () => {
    const options = resolveRuntimeStopOptions(argv ?? []);
    const projectRoot = findUpProjectRootOrAssert(process.cwd());
    process.exitCode = await runtimeStopAsync(projectRoot, options);
  })().catch(logCmdError);
};
