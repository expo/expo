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
      '--assert': String,
      '--build': String,
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
        `--assert <class>          Exit 20 when the change costs more than this class, and 22`,
        `                          when no class could be established. Without it, always 0.`,
        `--build <id>              Compare against an EAS build instead of the local record.`,
        `                          Needs --explain, because it asks the service.`,
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
        chalk`  {bold Exit codes} — {bold 0} always, because this is information rather than judgment, unless`,
        chalk`  {bold --assert} was given and turned it into a gate:`,
        '',
        chalk`     {bold 0}   a report was produced (and the assertion held, if one was made)`,
        chalk`    {bold 20}   {bold --assert} was given and the change costs more than the class named`,
        chalk`    {bold 22}   {bold --assert} was given and no class could be established — nothing to gate on`,
        chalk`     {bold 1}   this command could not do its job: a bad flag, an unusable value`,
        '',
        chalk`    {dim $} npx exagent status --assert js-only || echo "needs more than a reload"`,
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
  const { resolveAssertClass, resolveBuildId } =
    require('./resolveOptions') as typeof import('./resolveOptions');
  const { printStatusAsync } = require('./statusAsync') as typeof import('./statusAsync');

  return (async () => {
    const explain = !!args['--explain'];
    // Resolved before the project is found, so a bad flag fails on the flag rather than on the
    // directory somebody happened to run it in.
    const assertClass = resolveAssertClass(args['--assert']);
    const buildId = resolveBuildId(args['--build'], { explain });

    const projectRoot = findUpProjectRootOrAssert(process.cwd());
    const explicitDevServerUrl =
      args['--dev-server-url'] != null ? resolveDevServerUrlFlag(args['--dev-server-url']) : null;
    await printStatusAsync(projectRoot, {
      devServerUrl: explicitDevServerUrl,
      json: !!args['--json'],
      explain,
      assert: assertClass,
      buildId,
      followups: !args['--no-followups'],
    });
  })().catch(logCmdError);
};
