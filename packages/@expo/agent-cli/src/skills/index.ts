import { printCommandHelp } from '../help/format';
import type { CommandHelp } from '../help/types';
import { PROGRAM_PREFIX } from '../programName';
import type { Command } from '../types';
import { assertWithOptionsArgs, strayArgumentError } from '../utils/args';

export const skillsSyncHelp: CommandHelp = {
  command: 'skills:sync',
  usage: `${PROGRAM_PREFIX} skills:sync`,
  options: [
    `--agent <agent>          Link skills for specific agents (can be used multiple times)`,
    `--dry-run                Print planned changes without modifying the project`,
    `--json                   Print the result as one JSON object`,
    `--no-followups           Skip the "Suggested next:" section of suggested follow-up commands`,
    `-h, --help               Usage info`,
  ],
  examples: [
    {
      run: `${PROGRAM_PREFIX} skills:sync`,
      gets: 'the installed packages’ skills linked into the agent directories',
    },
    {
      run: `${PROGRAM_PREFIX} skills:sync --dry-run`,
      gets: 'what would be linked; nothing is written',
    },
    {
      run: `${PROGRAM_PREFIX} skills:sync --agent claude --json`,
      gets: 'the same for one agent, as one object',
    },
  ],
  next: ['skills:list', 'agents:setup', 'status'],
  json: {
    stdout: 'one object, and nothing else',
    stderr: 'progress and errors',
    keys: ['dryRun', 'agents', 'discovered', 'linked', 'removed', 'skipped', 'followups'],
  },
  notes: [
    `"${PROGRAM_PREFIX} skills" runs this action. Only symlinks this CLI created are managed, so a`,
    `file of your own with the same name is reported as skipped rather than replaced.`,
  ],
};

export const skillsListHelp: CommandHelp = {
  command: 'skills:list',
  usage: `${PROGRAM_PREFIX} skills:list`,
  options: [
    `--json                   Print the result as one JSON object`,
    `-h, --help               Usage info`,
  ],
  examples: [
    {
      run: `${PROGRAM_PREFIX} skills:list`,
      gets: 'the skills the installed packages ship, and where each one is linked',
    },
    { run: `${PROGRAM_PREFIX} skills:list --json`, gets: 'the same as one object under skills' },
  ],
  next: ['skills:show', 'skills:sync'],
  json: {
    stdout: 'one object, and nothing else',
    stderr: 'progress and errors',
    keys: ['skills'],
  },
};

export const skillsShowHelp: CommandHelp = {
  command: 'skills:show',
  usage: `${PROGRAM_PREFIX} skills:show <package> [skill]`,
  options: [`-h, --help               Usage info`],
  examples: [
    {
      run: `${PROGRAM_PREFIX} skills:show expo-router`,
      gets: 'the SKILL.md text of that package, printed as it is on disk',
    },
    {
      run: `${PROGRAM_PREFIX} skills:show expo-router expo-router`,
      gets: 'one named skill of that package, when it ships several',
    },
  ],
  next: ['skills:list', 'skills:sync'],
  notes: [
    `This prints the SKILL.md itself, so it has no --json: the document is the payload.`,
    `Read what a package teaches without linking it into an agent directory first.`,
  ],
};

export const skillsCleanHelp: CommandHelp = {
  command: 'skills:clean',
  usage: `${PROGRAM_PREFIX} skills:clean`,
  options: [
    `--dry-run                Print what would be removed without removing it`,
    `--json                   Print the result as one JSON object`,
    `-h, --help               Usage info`,
  ],
  examples: [
    {
      run: `${PROGRAM_PREFIX} skills:clean`,
      gets: 'every managed skill link is removed; your own files are left alone',
    },
    {
      run: `${PROGRAM_PREFIX} skills:clean --dry-run --json`,
      gets: 'what would go, as one object',
    },
  ],
  next: ['skills:sync', 'skills:list'],
  json: {
    stdout: 'one object, and nothing else',
    stderr: 'progress and errors',
    keys: ['dryRun', 'skillsDirs', 'removed'],
  },
  notes: [
    `Only symlinks into node_modules count as managed, so this is safe to run in a project that`,
    `keeps hand-written skills in the same directories.`,
  ],
};

/** The help of one action of the group, by the name the registry hands over as `argv[0]`. */
const SKILLS_HELP: { [action: string]: CommandHelp } = {
  sync: skillsSyncHelp,
  list: skillsListHelp,
  show: skillsShowHelp,
  clean: skillsCleanHelp,
};

export const agentCliSkills: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      '--dry-run': Boolean,
      '--json': Boolean,
      '--agent': [String],
      '--no-followups': Boolean,
      // Aliases
      '-h': '--help',
    },
    { argv, command: 'skills', positionalArgs: 'own' }
  );

  if (args['--help']) {
    // The registry hands the action over as the first argument, whichever spelling was used; the
    // bare `skills` runs `sync`, so that is what its help documents.
    printCommandHelp(SKILLS_HELP[String(args._[0] ?? 'sync')] ?? skillsSyncHelp);
  }

  // Load modules after the help prompt so `npx @expo/agent-cli skills:sync -h` shows as fast as possible.
  const { logCmdError, CommandError } =
    require('../utils/errors') as typeof import('../utils/errors');
  const { findUpProjectRootOrAssert } =
    require('../utils/findUp') as typeof import('../utils/findUp');
  // @ref llp/0004-smart-start-and-project-state.rfc.md §Not an Expo app
  // Three of the four actions discover the skills the installed Expo packages ship, so they
  // act on the app. Without `expo` they used to fail on module resolution and print a raw
  // Node stack. `clean` is the exception below.
  const { assertExpoAppSync } =
    require('../project/expoApp') as typeof import('../project/expoApp');
  const skillsAsync = require('./skillsAsync') as typeof import('./skillsAsync');

  try {
    const projectRoot = findUpProjectRootOrAssert(process.cwd());
    // The registry hands the action over as the first argument, whichever spelling was used
    // (`skills:list`, `skills list`, or the `sync` default of the bare `skills`).
    const action = args._[0] ?? 'sync';
    const options = {
      agents: args['--agent'] ?? [],
      dryRun: !!args['--dry-run'],
      followups: !args['--no-followups'],
      json: !!args['--json'],
    };

    // Only `show` names something; the other three act on the whole project. An argument on one of
    // those named nothing and was dropped, which read as a run that had understood it (llp/0010).
    const assertNoTarget = (name: string) => {
      const stray = args._.slice(1);
      if (stray.length > 0) {
        throw strayArgumentError(`skills:${name}`, stray, {
          hint: `this command acts on the whole project. To read one package's skill, run "${PROGRAM_PREFIX} skills:show ${stray[0]}".`,
        });
      }
    };

    // `clean` removes what an earlier run linked here, which is cleanup rather than action on an
    // app — the same reason `dev:stop` answers in a directory that holds none. Everything else
    // needs the installed `expo` package to discover anything at all.
    if (action !== 'clean') {
      assertExpoAppSync(projectRoot);
    }

    switch (action) {
      case 'sync':
        assertNoTarget('sync');
        return await skillsAsync.syncSkillsAsync(projectRoot, options);
      case 'list':
        assertNoTarget('list');
        return await skillsAsync.listSkillsAsync(projectRoot, { json: !!args['--json'] });
      case 'show': {
        const packageName = args._[1];
        if (!packageName) {
          throw new CommandError(
            'BAD_ARGS',
            `Missing package name. Usage: ${PROGRAM_PREFIX} skills:show <package> [skill]`
          );
        }
        return await skillsAsync.showSkillsAsync(projectRoot, packageName, args._[2]);
      }
      case 'clean':
        assertNoTarget('clean');
        return await skillsAsync.cleanSkillsAsync(projectRoot, options);
      default:
        throw new CommandError(
          'BAD_ARGS',
          `Unknown action: ${action}. Expected one of: skills:sync, skills:list, skills:show, skills:clean`
        );
    }
  } catch (error: any) {
    logCmdError(error);
  }
};
