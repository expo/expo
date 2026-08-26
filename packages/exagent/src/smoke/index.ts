import chalk from 'chalk';

import type { Command } from '../types';
import {
  assertWithOptionsArgs,
  DURATION_HELP_NOTE,
  DURATION_METAVAR,
  printHelp,
} from '../utils/args';

export const exagentSmoke: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    {
      argv,
      // The remaining options are resolved by `resolveSmokeOptions`, which owns their errors.
      permissive: true,
      command: 'smoke',
      // The options and the positional arguments are resolved together by this command's own
      // `resolveSmokeOptions`; a permissive parse cannot tell an unrecognized flag from a
      // positional argument, so it must not judge either.
      positionalArgs: 'own',
    }
  );

  if (args['--help']) {
    printHelp(
      `Prove the app still boots, on a device, in one command`,
      chalk`npx exagent smoke {dim [options]}`,
      [
        `--route <route>            Open this route before the error window`,
        `--ios, --android           Platform to drive; the host decides when none is named`,
        `--platform <ios|android>   The same, spelled the way --json reports it`,
        `--cloud                    Drive this project's EAS Simulator session, not a local device`,
        `--start                    Start a dev server when none is running`,
        `--window ${DURATION_METAVAR}         How long to watch for errors (default: 3s)`,
        `--timeout ${DURATION_METAVAR}        Total budget (default: 1m, 3m with --start)`,
        `--screenshot <path>        Where to write the picture (default: under .expo/exagent/)`,
        `--no-screenshot            Take no picture`,
        `--dev-server-url <url>     Dev server to use (default: the project's own, then 8081)`,
        `--port <number>            Dev server on this port, short for --dev-server-url`,
        `--no-route-check           Open --route without checking it against the project's routes`,
        `--json                     Print the result as JSON`,
        `--no-followups             Skip the "Suggested next:" section of suggested follow-up commands`,
        `-h, --help                 Usage info`,
      ].join('\n'),
      [
        '',
        chalk`  {dim $} npx exagent smoke`,
        chalk`  {dim $} npx exagent smoke --route /notes --json`,
        chalk`  {dim $} npx exagent smoke --start --window 5s`,
        '',
        `  ${DURATION_HELP_NOTE}`,
        '',
        chalk`  {bold Eight phases, one exit code.} Each asks the question of a command you can also run`,
        chalk`  on its own, in this order: a dev server is found, its bundler is waited for and`,
        chalk`  checked against this project, this project's entry bundle is built, an app is waited`,
        chalk`  for and opened if there is none ({bold navigate}), the`,
        chalk`  route is opened ({bold navigate}), the runtime is asked to evaluate {bold 1} ({bold runtime:eval}),`,
        chalk`  errors are collected over a window ({bold runtime:errors}), and the screen is`,
        chalk`  photographed. Every phase is reported with its status and how long it took.`,
        '',
        chalk`  {bold Exit codes:} {bold 0} passed · {bold 20} failed — the app threw, the entry bundle does not`,
        chalk`  compile, or the dev server belongs to another project · {bold 22} inconclusive — a wait`,
        chalk`  expired, no app connected, or the runtime cannot be read · {bold 1} the command itself`,
        chalk`  was wrong.`,
        '',
        chalk`  {bold What counts as a crash.} An {bold Error} the app reported — one that arrived with its own`,
        chalk`  stack — fails the run. A {bold console.error} line of plain text is counted and reported`,
        chalk`  separately, because a project that logs one on purpose would otherwise never pass.`,
        chalk`  This is not the same as "an uncaught exception": React Native does not send an`,
        chalk`  uncaught throw over the debugger's exception channel at all, it catches it and`,
        chalk`  reports it through the console one, so a gate reading the channel would pass every`,
        chalk`  crash. The cost is that {bold console.error(new Error(x))} is the same bytes as a throw and`,
        chalk`  fails too — the record is printed, so a reader sees which it was in one look.`,
        chalk`  LogBox is not read: reaching it from an evaluated expression needs a module id this`,
        chalk`  command does not have.`,
        '',
        chalk`  {bold A runtime that cannot be read never passes.} Expo Go for Android ships a JavaScript`,
        chalk`  engine with no Chrome DevTools Protocol debugger, so its error window is empty whatever`,
        chalk`  the app is doing. That is reported as {bold inconclusive} and exit {bold 22}, never as a pass —`,
        chalk`  a development build, or iOS, is what answers.`,
        '',
        chalk`  {bold The window is a window.} It catches what the app reports while it is open, so an`,
        chalk`  error thrown before it opened is not in it. {bold --window} buys more of the app settling.`,
        '',
        chalk`  {bold The device is resolved the way navigate resolves it:} a booted simulator or an`,
        chalk`  attached device first, then this project's EAS Simulator session when there is`,
        chalk`  neither. {bold --cloud} names the session outright. The {bold route} and {bold screenshot} phases`,
        chalk`  share that one answer, so the picture is always of the device the route was opened`,
        chalk`  on, and {bold deviceBackend} in {bold --json} says which of the three it was. A cloud session`,
        chalk`  needs a tunnelled dev server and a signed-in Expo account.`,
        '',
        chalk`  {bold --start is opt-in.} A gate that silently starts a dev server — and, for a project`,
        chalk`  that needs one, a native build — is a surprise. Without it a run with no dev server`,
        chalk`  exits {bold 20} and says so.`,
        '',
        chalk`  {bold The screenshot is of the screen,} not of the app: it holds whatever the device is`,
        chalk`  showing. It never decides the outcome — a machine with no simulator on it reports`,
        chalk`  {bold screenshot.ok: false} with a reason and answers the rest of the question anyway.`,
        '',
        chalk`  {bold web is not a platform for this command.} A browser registers nothing in the dev`,
        chalk`  server's debugger target list, so there is no runtime here to read. Run`,
        chalk`  {bold npx exagent typecheck} for the part of this that web can answer without a device.`,
        '',
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx exagent smoke -h` shows as fast as possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  // @ref llp/0020-not-an-expo-app.rfc.md — this command acts on the app, so it stops in a
  // directory that holds no app rather than planning work against whatever is there.
  const { findUpExpoAppRootOrAssert } =
    require('../project/expoApp') as typeof import('../project/expoApp');
  const { EXIT_OK, exitWithCodeAsync } = require('../exitCodes') as typeof import('../exitCodes');
  const { resolveSmokeOptions } =
    require('./resolveOptions') as typeof import('./resolveOptions');

  return (async () => {
    const options = resolveSmokeOptions(argv ?? []);
    // Asserting, unlike `dev:wait`: this command reads the project's routes and writes its
    // screenshot under the project's `.expo`, so there is no useful run outside one.
    const projectRoot = findUpExpoAppRootOrAssert(process.cwd());

    const { smokeAsync } = require('./smokeAsync') as typeof import('./smokeAsync');
    const code = await smokeAsync(projectRoot, options);
    if (code !== EXIT_OK) {
      // An outcome, not an error: it has already printed everything it has to say, and the code is
      // what the caller branches on (llp/0010 §Exit codes).
      await exitWithCodeAsync(code);
    }
  })().catch(logCmdError);
};
