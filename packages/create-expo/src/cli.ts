#!/usr/bin/env node
import type { Spec } from 'arg';
import { styleText } from 'node:util';

import { CLI_NAME } from './cmd';
import { ExitError } from './error';
import { Log } from './log';
import { formatSelfCommand } from './resolvePackageManager';
import { assertWithOptionsArgs, printHelp, resolveStringOrBooleanArgsAsync } from './utils/args';

const debug = require('debug')('expo:init:cli') as typeof console.log;

async function run() {
  const argv = process.argv.slice(2) ?? [];
  const rawArgsMap: Spec = {
    // Types
    '--yes': Boolean,
    '--no-install': Boolean,
    '--no-agents-md': Boolean,
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
    const nameWithoutCreate = CLI_NAME.replace('create-', '');
    printHelp(
      `Creates a new Expo project`,
      `npx ${CLI_NAME} ${styleText('cyan', `<path>`)} [options]`,
      [
        `-y, --yes             Use the default options for creating a project`,
        `    --no-install      Skip installing npm packages or CocoaPods`,
        `    --no-agents-md    Skip generating AGENTS.md, CLAUDE.md, and .claude/settings.json`,
        `-t, --template ${styleText('gray', `[pkg]`)}  NPM template to use: default, blank, blank-typescript, tabs, bare-minimum. Default: default`,
        `-e, --example ${styleText('gray', `[name]`)}  Example name from ${styleText('underline', `https://github.com/expo/examples`)}.`,
        `-v, --version         Version number`,
        `-h, --help            Usage info`,
      ].join('\n'),
      `
    ${styleText('gray', `To choose a template pass in the ${styleText('bold', `--template`)} arg:`)}

    ${styleText('gray', `$`)} ${formatSelfCommand()} ${styleText('cyan', `--template`)}

    ${styleText('gray', `To choose an Expo example pass in the ${styleText('bold', `--example`)} arg:`)}

    ${styleText('gray', `$`)} ${formatSelfCommand()} ${styleText('cyan', `--example`)}
    ${styleText('gray', `$`)} ${formatSelfCommand()} ${styleText('cyan', `--example with-router`)}

    ${styleText('gray', `The package manager used for installing`)}
    ${styleText('gray', `node modules is based on how you invoke the CLI:`)}

    ${styleText('bold', ` npm:`)} ${styleText('cyan', `npx ${CLI_NAME}`)}
    ${styleText('bold', `yarn:`)} ${styleText('cyan', `yarn create ${nameWithoutCreate}`)}
    ${styleText('bold', `pnpm:`)} ${styleText('cyan', `pnpm create ${nameWithoutCreate}`)}
    ${styleText('bold', ` bun:`)} ${styleText('cyan', `bun create ${nameWithoutCreate}`)}
    `
    );
  }

  const { AnalyticsEventPhases, AnalyticsEventTypes, flushAsync, track } =
    await import('./telemetry');
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
      agentsMd: !args['--no-agents-md'],
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
