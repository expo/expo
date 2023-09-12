#!/usr/bin/env node
import { Spec } from 'arg';
import chalk from 'chalk';

import { CLI_NAME } from './cmd';
import { ExitError } from './error';
import { Log } from './log';
import { assertWithOptionsArgs, printHelp, resolveStringOrBooleanArgsAsync } from './utils/args';

const debug = require('debug')('expo:init:cli') as typeof console.log;

async function run() {
  const argv = process.argv.slice(2) ?? [];
  const rawArgsMap: Spec = {
    // Types
    '--yes': Boolean,
    '--no-install': Boolean,
    '--help': Boolean,
    '--version': Boolean,
    // Aliases
    '-y': '--yes',
    '-h': '--help',
    '-v': '--version',
  };
  const args = assertWithOptionsArgs(rawArgsMap, {
    argv,
    permissive: true,
  });

  if (args['--version']) {
    Log.exit(require('../package.json').version, 0);
  }

  if (args['--help']) {
    printHelp(
      `Creates a new Expo project`,
      chalk`npx ${CLI_NAME} {cyan <path>} [options]`,
      [
        `-y, --yes             Use the default options for creating a project`,
        `    --no-install      Skip installing npm packages or CocoaPods`,
        chalk`-t, --template {gray [pkg]}  NPM template to use: blank, tabs, bare-minimum. Default: blank`,
        chalk`-e, --example {gray [name]}  Example name from {underline https://github.com/expo/examples}.`,
        `-v, --version         Version number`,
        `-h, --help            Usage info`,
      ].join('\n'),
      chalk`
    {gray To choose a template pass in the {bold --template} arg:}

    {gray $} npm create expo-app {cyan --template}

    {gray To choose an Expo example pass in the {bold --example} arg:}

    {gray $} npm create expo-app {cyan --example}
    {gray $} npm create expo-app {cyan --example with-router}

    {gray The package manager used for installing}
    {gray node modules is based on how you invoke the CLI:}

    {bold  npm:} {cyan npm create expo-app}
    {bold yarn:} {cyan yarn create expo-app}
    {bold pnpm:} {cyan pnpm create expo-app}
    {bold  bun:} {cyan bunx create-expo-app}
    `
    );
  }

  const { AnalyticsEventPhases, AnalyticsEventTypes, flushAsync, track } = await import(
    './telemetry'
  );
  try {
    const parsed = await resolveStringOrBooleanArgsAsync(argv, rawArgsMap, {
      '--template': Boolean,
      '--example': Boolean,
      '-t': '--template',
      '-e': '--example',
    });

    debug(`Default args:\n%O`, args);
    debug(`Parsed:\n%O`, parsed);

    const { createAsync } = await import('./createAsync');
    await createAsync(parsed.projectRoot, {
      yes: !!args['--yes'],
      template: parsed.args['--template'],
      example: parsed.args['--example'],
      install: !args['--no-install'],
    });

    // Track successful event.
    track({
      event: AnalyticsEventTypes.CREATE_EXPO_APP,
      properties: { phase: AnalyticsEventPhases.SUCCESS },
    });
    // Flush all events.
    await flushAsync();
  } catch (error: any) {
    // ExitError has already been logged, all others should be logged before exiting.
    if (!(error instanceof ExitError)) {
      Log.exception(error);
    }

    // Track the failure.
    track({
      event: AnalyticsEventTypes.CREATE_EXPO_APP,
      properties: { phase: AnalyticsEventPhases.FAIL, message: error.cause },
    });

    // Flush all telemetry events.
    await flushAsync().finally(() => {
      // Exit with the error code or non-zero.
      // Ensure we exit even if the telemetry fails.
      process.exit(error.code || 1);
    });
  } finally {
    const shouldUpdate = await (await import('./utils/update-check')).default;
    await shouldUpdate();
  }
}

run();
