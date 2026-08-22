#!/usr/bin/env node
import chalk from 'chalk';

import type { Command } from '../index';
import { assertArgs, getProjectRoot, printHelp } from '../utils/args';

export const expoNeedsRebuild: Command = async (argv) => {
  // A mistyped flag exits 1 through the same path every command uses. Exit code 1 is
  // reserved exclusively for bad input — it never doubles as one of this command's check
  // results, so a script or agent can always tell "fix your command" apart from any verdict.
  const args = assertArgs(
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
    1  invalid usage — a mistyped flag or unsupported --platform/--app-id combination
    2  rebuild required — run {bold npx expo run:<platform>}
    3  prebuild required — run {bold npx expo prebuild}, then rebuild
    4  cannot determine — no device, app not installed, no embedded fingerprint, or an error
`
    );
  }

  // Load modules after the help prompt so `npx expo needs-rebuild -h` shows as fast as possible.
  const [
    // ./needsRebuildAsync
    { needsRebuildAsync },
    // ../utils/errors
    { AbortCommandError, CommandError, SilentError },
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
    // The exit code is this command's public API. `AbortCommandError`/`SilentError` extend
    // `CommandError`, so they're checked first: neither is a usage error, so both report
    // "cannot determine" (4), the same as any other failure that isn't a bad --platform or
    // --app-id value. A plain `CommandError` (from resolvePlatformOption or the --app-id
    // check above) is a usage error — the same category as a mistyped flag — so it gets the
    // same code: 1.
    if (!(error instanceof Error)) {
      throw error;
    }
    if (error instanceof AbortCommandError || error instanceof SilentError) {
      process.exit(4);
    }
    if (error instanceof CommandError) {
      Log.exit(error, 1);
    }
    Log.exit(error, 4);
  }

  // A detached device read (worst case a full APK pull) must not keep the process alive
  // after the verdict is printed. Exit explicitly once stdout is flushed.
  await new Promise<void>((resolve) => process.stdout.write('', () => resolve()));
  process.exit();
};
