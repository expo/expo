import { printCommandHelp } from '../help/format';
import type { CommandHelp } from '../help/types';
import { PROGRAM_PREFIX } from '../programName';
import type { Command } from '../types';
import { assertWithOptionsArgs } from '../utils/args';

export const statusHelp: CommandHelp = {
  command: 'status',
  usage: `${PROGRAM_PREFIX} status`,
  options: [
    `--json                    Print the whole report as JSON, raw project probe included`,
    `--explain                 The deep dive: which sources changed, whether an update can\n` +
      `                          ship over the air, and a fresh answer from EAS about builds\n` +
      `                          for this fingerprint. Slower than the default report`,
    `--assert <class>          Exit 20 when the change costs more than this class, and 22\n` +
      `                          when no class could be established. Without it, always 0`,
    `--build <id>              Compare against an EAS build instead of the local record.\n` +
      `                          Needs --explain, because it asks the service`,
    `--dev-server-url <url>    Dev server to probe (default: the project's own, then 8081-8085)`,
    `--no-followups            Leave the suggested follow-up commands out of the report`,
    `--no-fingerprint-cache    Hash the project again instead of revalidating the cached hash`,
    `-h, --help                Usage info`,
  ],
  examples: [
    {
      run: `${PROGRAM_PREFIX} status`,
      gets: 'the brief: what this project is, what is running, and the command to run next',
    },
    {
      run: `${PROGRAM_PREFIX} status --json`,
      gets: 'the same as one object, with the raw project probe under probe',
    },
    {
      run: `${PROGRAM_PREFIX} status --explain`,
      gets: 'the sources that changed, the OTA verdict, and what EAS already has built',
    },
    {
      run: `${PROGRAM_PREFIX} status --assert js-only`,
      gets: 'exit 20 when the change needs more than a reload; a gate for a script',
    },
  ],
  next: ['dev', 'smoke', 'doctor'],
  json: {
    stdout: 'one object, and nothing else',
    stderr: 'progress and errors',
    keys: [
      'project',
      'expoGo',
      'freshness',
      'builds',
      'devServer',
      'device',
      'skills',
      'auth',
      'next',
      'assertion',
      'probe',
      'errors',
      'followups',
    ],
  },
  notes: [
    `Read-only, like git status. Nothing is started, built or changed; the only writes are this`,
    `command's own caches under .expo. It exits 0 unless --assert turned it into a gate.`,
    `The impact line says what has changed since the last build this CLI made, and what that`,
    `costs: js-only, dev-client-compatible, or needs-native-build. It is free and always there.`,
    `--assert exit codes: 20 the change costs more than the class named · 22 no class could be`,
    `established · 1 the command itself was wrong.`,
    `The fingerprint is cached per platform and revalidated against the files that can move it.`,
    `It cannot see inside ios/ or android/, so entries expire after ten minutes.`,
  ],
};

export const agentCliStatus: Command = async (argv) => {
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
      '--no-fingerprint-cache': Boolean,
      // Aliases
      '-h': '--help',
    },
    { argv, command: 'status', positionalArgs: 'none' }
  );

  if (args['--help']) {
    printCommandHelp(statusHelp);
  }

  // Load modules after the help prompt so `npx @expo/agent-cli status -h` shows as fast as possible.
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
      // Undefined rather than `true` when the flag is absent, so `AGENT_CLI_NO_FINGERPRINT_CACHE`
      // still decides: a flag that was not passed states nothing.
      fingerprintCache: args['--no-fingerprint-cache'] ? false : undefined,
    });
  })().catch(logCmdError);
};
