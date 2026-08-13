#!/usr/bin/env node
import chalk from 'chalk';

import type { Command } from '../index';
import { assertArgs, getProjectRoot, printHelp } from '../utils/args';

export const expoNeedsRebuild: Command = async (argv) => {
  let args: ReturnType<typeof assertArgs>;
  try {
    args = assertArgs(
      {
        // Types
        '--help': Boolean,
        '--json': Boolean,
        '--platform': String,
        '--device': String,
        '--app-id': String,
        // Aliases
        '-h': '--help',
        '-p': '--platform',
        '-d': '--device',
      },
      argv
    );
  } catch (error: any) {
    // A mistyped flag must not exit with code 1 — see the exit-code note below.
    if (!(error instanceof Error)) {
      throw error;
    }
    (await import('../log.js')).exit(error, 3);
    throw error; // Unreachable — `exit` never returns; this satisfies control-flow analysis.
  }

  if (args['--help']) {
    printHelp(
      `Check whether the installed native app must be rebuilt`,
      chalk`npx expo needs-rebuild {dim <dir>}`,
      [
        chalk`<dir>                              Directory of the Expo project. {dim Default: Current working directory}`,
        chalk`-p, --platform <all|android|ios>   Platforms to check. {dim Default: platforms with a reachable device}`,
        `-d, --device <name|udid|serial>    Only check the matching simulator or device`,
        chalk`--app-id <id>                      Application ID to look for. {dim Default: resolved from the project; requires a single --platform}`,
        `--json                             Output the result as JSON`,
        `-h, --help                         Usage info`,
      ].join('\n'),
      chalk`
  {bold Exit codes}
    0  up to date — a JS reload is enough
    1  rebuild required — run {bold npx expo run:<platform>}
    2  prebuild required — run {bold npx expo prebuild}, then rebuild
    3  cannot determine — no device, app not installed, no embedded fingerprint, or an error
`
    );
  }

  // Load modules after the help prompt so `npx expo needs-rebuild -h` shows as fast as possible.
  const [
    // ./needsRebuildAsync
    { needsRebuildAsync },
    // ../utils/errors
    { AbortCommandError, SilentError },
    // ../log
    Log,
  ] = await Promise.all([
    import('./needsRebuildAsync.js'),
    import('../utils/errors.js'),
    import('../log.js'),
  ]);

  try {
    await needsRebuildAsync(getProjectRoot(args), {
      // Parsed options
      platform: args['--platform'],
      device: args['--device'],
      appId: args['--app-id'],
      json: args['--json'],
    });
  } catch (error: any) {
    // The exit code is this command's public API (1 = rebuild required), so an error —
    // usage or unexpected — must never surface as code 1. Report it as 3: cannot determine.
    if (!(error instanceof Error)) {
      throw error;
    }
    if (error instanceof AbortCommandError || error instanceof SilentError) {
      process.exit(3);
    }
    Log.exit(error, 3);
  }

  // A detached device read (worst case a full APK pull) must not keep the process alive
  // after the verdict is printed. Exit explicitly once stdout is flushed.
  await new Promise<void>((resolve) => process.stdout.write('', () => resolve()));
  process.exit();
};
