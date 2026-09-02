import { printCommandHelp } from '../help/format';
import type { CommandHelp } from '../help/types';
import { PROGRAM_PREFIX } from '../programName';
import type { Command } from '../types';
import { assertWithOptionsArgs } from '../utils/args';

export const installHelp: CommandHelp = {
  command: 'install',
  usage: `${PROGRAM_PREFIX} install <package>...`,
  options: [
    `--check             Report which installed packages are out of date, and install nothing`,
    `--json              Print the result as JSON`,
    `--no-agent-skills   Skip linking agent skills from the installed packages`,
    `--no-skill-context  Skip printing installed skills for a detected coding agent`,
    `--no-impact         Skip the report of what must rerun after the install`,
    `--no-followups      Skip the "Suggested next:" section of suggested follow-up commands`,
    `-h, --help          Usage info`,
  ],
  examples: [
    {
      run: `${PROGRAM_PREFIX} install expo-sqlite`,
      gets: 'the version this SDK wants, installed, and any skills it ships linked',
    },
    {
      run: `${PROGRAM_PREFIX} install --check`,
      gets: 'which installed packages are out of date; nothing is installed',
    },
    {
      run: `${PROGRAM_PREFIX} install expo-router --json`,
      gets: 'one object: what was installed, what must rerun, which packages ship skills',
    },
    {
      run: `${PROGRAM_PREFIX} install react -- --verbose`,
      gets: 'the same install, with everything after -- handed to the package manager',
    },
  ],
  next: ['status', 'dev', 'typecheck'],
  json: {
    stdout: 'one object, and nothing else',
    stderr: 'the Expo CLI’s own output, progress and errors',
    keys: [
      'projectRoot',
      'packages',
      'installed',
      'exitCode',
      'impact',
      'skillPackages',
      'check',
      'followups',
    ],
  },
  notes: [
    `The expo install flags are forwarded to the project's Expo CLI: --check, --dev, --fix,`,
    `--npm, --pnpm, --yarn, --bun. Run "npx expo install --help" for what they do.`,
    `${PROGRAM_PREFIX} add is this same command, because expo add is expo install.`,
  ],
};

export const agentCliInstall: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    {
      argv,
      // Every other option belongs to `expo install` and is forwarded untouched.
      permissive: true,
      command: 'install',
      // The options and the positional arguments are resolved together, per action,
      // by this command's own `resolve*Options`; a permissive parse cannot tell an
      // unrecognized flag from a positional argument, so it must not judge either.
      positionalArgs: 'own',
    }
  );

  if (args['--help']) {
    printCommandHelp(installHelp);
  }

  // Load modules after the help prompt so `npx @expo/agent-cli install -h` shows as fast as possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  const { findUpProjectRootOrAssert } =
    require('../utils/findUp') as typeof import('../utils/findUp');
  const { resolveInstallPlan } = require('./resolveOptions') as typeof import('./resolveOptions');
  const { installAsync } = require('./installAsync') as typeof import('./installAsync');

  return (async () => {
    const projectRoot = findUpProjectRootOrAssert(process.cwd());
    const exitCode = await installAsync(projectRoot, resolveInstallPlan(argv ?? []));
    process.exitCode = exitCode;
  })().catch(logCmdError);
};
