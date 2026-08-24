import chalk from 'chalk';

import type { Command } from '../types';
import { assertWithOptionsArgs, printHelp } from '../utils/args';

export const exagentConfigEffective: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      '--json': Boolean,
      '--platform': String,
      '--file': String,
      '--no-followups': Boolean,
      // Aliases
      '-h': '--help',
    },
    { argv }
  );

  if (args['--help']) {
    printHelp(
      `What the config plugins actually produced for each platform`,
      chalk`npx exagent config:effective {dim [options]}`,
      [
        `--platform <ios|android|all>  Platform to introspect (default: all)`,
        `--file <name>                 Print one native file: infoPlist, entitlements, expoPlist,`,
        `                              podfileProperties, manifest, gradleProperties, strings,`,
        `                              colors, colorsNight, styles`,
        `--json                        Print the whole report as JSON, every value included`,
        `--no-followups                Leave the suggested follow-up commands out of the report`,
        `-h, --help                    Usage info`,
      ].join('\n'),
      [
        '',
        chalk`  Read-only. It runs {bold expo config --type introspect --json} as a subprocess, which`,
        chalk`  compiles the config plugins in memory and writes nothing to the project, then reports`,
        chalk`  what came out: the native files per platform, the plugins that ran, and which of them`,
        chalk`  the app config actually declared. A plugin that ran without being declared is`,
        chalk`  auto-applied from an installed package, which is why it is in no {bold app.json}.`,
        '',
        chalk`  The default output is counts, because the values are kilobytes of plist and XML.`,
        chalk`  {bold --file} prints one of them, and {bold --json} prints all of them.`,
        '',
        chalk`  Two mods are never covered: {bold ios.xcodeproj} and every dangerous mod are dropped`,
        chalk`  before introspection runs, so their absence means "not answered", not "unchanged".`,
        '',
        chalk`  The SDK this reports is {bold configuredSdkVersion} — the version the evaluated app`,
        chalk`  config resolves to, e.g. {bold 57.0.0}. It is not the {bold sdkVersion} of`,
        chalk`  {bold exagent status}, which is the version of the installed {bold expo} package, e.g.`,
        chalk`  {bold 57.0.15}. Both are right; they answer different questions.`,
        '',
        chalk`  {bold npx exagent config} is {bold expo config}, unchanged. Only the colon form is this`,
        chalk`  command.`,
        '',
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx exagent config:effective -h` shows as fast as
  // possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  const { findUpProjectRootOrAssert } =
    require('../utils/findUp') as typeof import('../utils/findUp');
  const { printEffectiveConfigAsync } =
    require('./effectiveAsync') as typeof import('./effectiveAsync');

  return (async () => {
    const projectRoot = findUpProjectRootOrAssert(process.cwd());
    await printEffectiveConfigAsync(projectRoot, {
      platform: args['--platform'],
      file: args['--file'] ?? null,
      json: !!args['--json'],
      followups: !args['--no-followups'],
    });
  })().catch(logCmdError);
};
