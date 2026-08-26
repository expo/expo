import chalk from 'chalk';

import type { Command } from '../types';
import { assertWithOptionsArgs, printHelp } from '../utils/args';

export const exagentStatus: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      '--json': Boolean,
      '--explain': Boolean,
      '--dev-server-url': String,
      '--no-followups': Boolean,
      // Aliases
      '-h': '--help',
    },
    { argv, command: 'status', positionalArgs: 'none' }
  );

  if (args['--help']) {
    printHelp(
      `Where the project is now and what would happen next`,
      chalk`npx exagent status`,
      [
        `--json                    Print the whole report as JSON, raw project probe included`,
        `--explain                 The deep dive: which sources changed, whether an update can`,
        `                          ship over the air, and a fresh answer from EAS about builds`,
        `                          for this fingerprint. Slower — it spawns "expo config" and`,
        `                          calls EAS; the default report spawns neither.`,
        `--dev-server-url <url>    Dev server to probe (default: the project's own, then 8081-8085)`,
        `--no-followups            Leave the suggested follow-up commands out of the report`,
        `-h, --help                Usage info`,
      ].join('\n'),
      [
        '',
        chalk`  A read-only overview, like {bold git status}: what the project is, whether Expo Go can`,
        chalk`  run it, whether the last development build still matches, whether a dev server is`,
        chalk`  running with an app connected, which agent skills are linked, and the command that`,
        chalk`  would get the app onto a device.`,
        '',
        chalk`  Nothing is started or built, and nothing in the project is changed — {bold --explain} caches`,
        chalk`  its answer under {bold .expo}, and that is the only thing this command ever writes. It always`,
        chalk`  exits 0, so a script can read the report without branching on the exit code.`,
        '',
        chalk`  The {bold impact} line says what has changed since the last build this CLI made, and what`,
        chalk`  that costs: {bold js-only}, {bold dev-client-compatible}, or {bold needs-native-build}. It is computed`,
        chalk`  from two fingerprints already in hand, so it costs nothing and is always there.`,
        '',
        chalk`  {bold --explain} pays for the rest: the sources that changed one by one, whether an update`,
        chalk`  published now would reach the installed builds ({bold runtimeVersion}), and a fresh answer`,
        chalk`  from EAS about whether it already has a build for this exact fingerprint — which can`,
        chalk`  be downloaded with {bold eas build:download} instead of rebuilt.`,
        '',
        chalk`  To {bold gate} on the class rather than read it, use {bold exagent impact}, which exits non-zero`,
        chalk`  when the change costs more than you asserted:`,
        '',
        chalk`    {dim $} npx exagent impact --assert js-only`,
        '',
        chalk`  This command always exits 0, so it can report and never judge.`,
        '',
        chalk`  {bold --json} carries the raw project probe too, under {bold probe}: the SDK version, the`,
        chalk`  native state, the fingerprint, and every reason Expo Go cannot run the project, exactly`,
        chalk`  as the probe read them. That is the project brief, so nothing needs a second command.`,
        '',
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx exagent status -h` shows as fast as possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  const { findUpProjectRootOrAssert } =
    require('../utils/findUp') as typeof import('../utils/findUp');
  const { resolveDevServerUrlFlag } =
    require('../runtime/devServer') as typeof import('../runtime/devServer');
  const { printStatusAsync } = require('./statusAsync') as typeof import('./statusAsync');

  return (async () => {
    const projectRoot = findUpProjectRootOrAssert(process.cwd());
    const explicitDevServerUrl =
      args['--dev-server-url'] != null ? resolveDevServerUrlFlag(args['--dev-server-url']) : null;
    await printStatusAsync(projectRoot, {
      devServerUrl: explicitDevServerUrl,
      json: !!args['--json'],
      explain: !!args['--explain'],
      followups: !args['--no-followups'],
    });
  })().catch(logCmdError);
};
