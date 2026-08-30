// @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract
// `@expo/agent-cli inspect:config-plugins`, which the v1 narrowing renamed from `config:effective`
// (llp/0016). The old name put it under a group named after a forwarded `expo` command, so it was
// reachable by its colon form only (llp/0010 §Registry rules, rule b); `inspect` is this CLI's own
// name, so `@expo/agent-cli inspect config-plugins` resolves too. `@expo/agent-cli config` is still `expo config`.
//
// The directory stays `src/config/`, which is what it reads.

import { printCommandHelp } from '../help/format';
import type { CommandHelp } from '../help/types';
import { PROGRAM_PREFIX } from '../programName';
import type { Command } from '../types';
import { assertWithOptionsArgs } from '../utils/args';

export const inspectConfigPluginsHelp: CommandHelp = {
  command: 'inspect:config-plugins',
  usage: `${PROGRAM_PREFIX} inspect:config-plugins`,
  options: [
    `--platform <ios|android|all>  Platform to introspect (default: all)`,
    `--file <name>                 Print one native file: infoPlist, entitlements, expoPlist,\n` +
      `                              podfileProperties, manifest, gradleProperties, strings,\n` +
      `                              colors, colorsNight, styles`,
    `--json                        Print the whole report as JSON, every value included`,
    `--no-followups                Leave the suggested follow-up commands out of the report`,
    `-h, --help                    Usage info`,
  ],
  examples: [
    {
      run: `${PROGRAM_PREFIX} inspect:config-plugins`,
      gets: 'counts per platform: the native files produced, and the plugins that ran',
    },
    {
      run: `${PROGRAM_PREFIX} inspect:config-plugins --file infoPlist`,
      gets: 'the Info.plist the plugins produced, in full',
    },
    {
      run: `${PROGRAM_PREFIX} inspect:config-plugins --platform android --json`,
      gets: 'every value for one platform, as one object',
    },
  ],
  next: ['status', 'doctor', 'install'],
  json: {
    stdout: 'one object, and nothing else',
    stderr: 'progress and errors',
    keys: [
      'projectRoot',
      'configuredSdkVersion',
      'source',
      'platforms',
      'plugins',
      'declaredNotApplied',
      'expoAutolinkedModules',
      'expoAutolinkedModulesNote',
      'notAttributable',
      'followups',
    ],
  },
  notes: [
    `Read-only: expo config --type introspect --json compiles the plugins in memory and writes`,
    `nothing. A plugin that ran undeclared is auto-applied from an installed package.`,
    `ios.xcodeproj and every dangerous mod are dropped first, so their absence means`,
    `"not answered", never "unchanged".`,
    `configuredSdkVersion is what the app config resolves to, which is not the sdkVersion of`,
    `"${PROGRAM_PREFIX} status" — that is the installed expo package. Both are right.`,
    `"${PROGRAM_PREFIX} config" is expo config, unchanged. Only the colon form is this command.`,
  ],
};

export const agentCliInspectConfigPlugins: Command = async (argv) => {
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
    { argv, command: 'inspect:config-plugins', positionalArgs: 'none' }
  );

  if (args['--help']) {
    printCommandHelp(inspectConfigPluginsHelp);
  }

  // Load modules after the help prompt so `npx @expo/agent-cli inspect:config-plugins -h` shows as fast as
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
