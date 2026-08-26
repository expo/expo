import chalk from 'chalk';

import type { Command } from '../types';
import { assertWithOptionsArgs, printHelp } from '../utils/args';

export const exagentDev: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    {
      argv,
      // Every other option belongs to the `expo` CLI and is forwarded to the step that accepts it.
      permissive: true,
      command: 'dev',
      // The options and the positional arguments are resolved together, per action,
      // by this command's own `resolve*Options`; a permissive parse cannot tell an
      // unrecognized flag from a positional argument, so it must not judge either.
      positionalArgs: 'own',
    }
  );

  if (args['--help']) {
    printHelp(
      `Get this app onto a device: decide what must run, print the plan, then run it`,
      chalk`npx exagent dev {dim [options]}`,
      [
        `--detach            Run the dev server in the background and give the terminal back`,
        `--wait-ready        With --detach, also wait for the bundler before reporting`,
        `--plan              Print what must run to get this app on a device, then exit`,
        `--yes               Run a plan that builds without asking for confirmation`,
        `--json              Print the plan as JSON, for --plan and for a run`,
        `--port <number>     Port for the dev server, so a busy 8081 needs no answer`,
        `--ios, --android, --web   Platform to plan for; the host decides when none is named`,
        `--eas, --local      Where the native build runs: in the cloud on EAS, or on this machine`,
        `--go, --dev-client  Which app to run the project in, when both would work`,
        `--no-agent-skills   Skip linking agent skills from installed packages`,
        `--no-followups      Skip the "Suggested next:" section of suggested follow-up commands`,
        `--no-checkpoint     Skip the git snapshot taken before a plan that prebuilds`,
        `-h, --help          Usage info`,
      ].join('\n'),
      [
        '',
        chalk`  This command decides between {bold expo start}, {bold expo prebuild} and`,
        chalk`  {bold expo run:ios}/{bold expo run:android} from the project state, prints that plan, and runs it.`,
        chalk`  {bold --plan} only reports the decision, so an agent can ask for approval before`,
        chalk`  anything runs. In a terminal, a plan that prebuilds or builds is confirmed once`,
        chalk`  before it starts; {bold --yes} answers that question up front, and a non-interactive`,
        chalk`  run (an agent, or CI) is never asked.`,
        chalk`    {dim $} npx exagent dev`,
        chalk`    {dim $} npx exagent dev --plan --ios`,
        '',
        chalk`  {bold A build runs in one of two places, and the plan picks before it prints.} A local`,
        chalk`  build ({bold expo prebuild} + {bold expo run:ios}/{bold expo run:android}) happens on this machine and`,
        chalk`  needs Xcode for ios or the Android SDK for android. A cloud build ({bold eas build}) happens`,
        chalk`  on EAS and needs an Expo account instead. Both take many minutes the first time.`,
        chalk`  When this machine cannot do the local one — no Xcode, no Android SDK, or a host that`,
        chalk`  cannot have them at all, such as ios on Linux — the plan {bold is} the cloud one, and its`,
        chalk`  {bold Build:} line says which and why. Nothing is ever swapped once a plan is printed.`,
        chalk`    {dim $} npx exagent dev --plan {dim # shows the choice and the reason}`,
        chalk`    {dim $} npx exagent dev --eas {dim # force the cloud, whatever this machine has}`,
        chalk`    {dim $} npx exagent dev --local {dim # force this machine, and say so when it cannot}`,
        '',
        chalk`  {bold The project can choose for you}, in {bold package.json} under {bold expo.exagent}:`,
        `      "expo": { "exagent": { "buildBackend": "eas", "target": "dev-build" } }`,
        chalk`  {bold buildBackend} is {bold local} or {bold eas}, and may be given per platform under an {bold ios} or`,
        chalk`  {bold android} key. {bold target} is {bold expo-go} or {bold dev-build}, which asks for a development`,
        chalk`  build even where Expo Go could run the project. A flag on the command line beats the`,
        chalk`  config, and the config beats what this machine looks like. Every decision the config`,
        chalk`  changed is labelled in the plan's {bold Why} list.`,
        '',
        chalk`  {bold This command blocks.} Without {bold --detach} it runs the dev server in the foreground`,
        chalk`  and does not return until that server stops, so nothing else can run in this shell —`,
        chalk`  including the {bold Suggested next:} commands it prints. {bold --detach} starts the same dev`,
        chalk`  server in a process of its own, prints its url, pid and log file, and exits.`,
        chalk`    {dim $} npx exagent dev --detach --wait-ready --port 8081`,
        chalk`    {dim $} npx exagent dev:logs {dim # what it has printed since}`,
        chalk`    {dim $} npx exagent dev:stop {dim # ends it, wherever it was started from}`,
        '',
        chalk`  A detached dev server outlives the shell that started it, and there is at most one`,
        chalk`  per project: a second {bold --detach} on a project that already has one reports the`,
        chalk`  running server and exits {bold 0} rather than starting a process nothing could find.`,
        '',
        chalk`  For a dev server that no planning may touch, run {bold npx exagent start}, which is`,
        chalk`  {bold expo start} with every argument forwarded untouched.`,
        chalk`    {dim $} npx exagent start --web --port 8082`,
        '',
        chalk`  {bold A busy port needs no answer.} When the port is taken the Expo CLI asks whether to`,
        chalk`  use another one; this command answers for it, starts on a free port it picks, and says`,
        chalk`  which one on stderr. Nobody is asked and nothing exits {bold 7}.`,
        chalk`  {bold --port} turns that into a requirement instead: naming a port means {bold that} port, so a`,
        chalk`  run whose port is taken fails with exit {bold 20} naming the process that holds it, rather`,
        chalk`  than starting somewhere the URLs you already have do not point.`,
        chalk`    {dim $} npx exagent dev --yes --json --port 8082`,
        '',
        chalk`  {bold The options of expo start are accepted too} and passed to the {bold expo start} the plan`,
        chalk`  ends with, when it ends with one: {bold --go}, {bold --dev-client}, {bold --clear}, {bold --host}, {bold --tunnel},`,
        chalk`  {bold --lan}, {bold --localhost}, {bold --offline}, {bold --no-dev}, {bold --minify}, {bold --max-workers},`,
        chalk`  {bold --scheme}, {bold --https}, {bold --private-key-path} and their short forms. A plan ending in a`,
        chalk`  build reports the arguments it could not pass on. Anything neither CLI has is refused`,
        chalk`  here, before the plan is decided, rather than forwarded and reported a step later.`,
        '',
        chalk`  Run {bold npx expo start --help} for what each of those does, and {bold npx exagent start} to`,
        chalk`  reach {bold expo start} with every argument forwarded untouched.`,
        '',
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx exagent dev -h` shows as fast as possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  const { findUpProjectRootOrAssert } =
    require('../utils/findUp') as typeof import('../utils/findUp');
  const { resolveDevOptions } = require('./resolveOptions') as typeof import('./resolveOptions');

  return (async () => {
    const projectRoot = findUpProjectRootOrAssert(process.cwd());
    const options = resolveDevOptions(argv ?? []);

    // @ref llp/0004-smart-start-and-project-state.rfc.md §`exagent status` — Renamed: the
    // plan-first engine is `exagent dev`, and `exagent start` is the plain `expo start` wrapper.
    const { devAsync } = require('./devAsync') as typeof import('./devAsync');
    process.exitCode = await devAsync(projectRoot, options);
  })().catch(logCmdError);
};
