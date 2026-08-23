import chalk from 'chalk';

import type { Command } from '../types';
import { assertWithOptionsArgs, printHelp } from '../utils/args';

export const exagentSkills: Command = async (argv) => {
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
    { argv }
  );

  if (args['--help']) {
    printHelp(
      `Link agent skills from installed npm packages`,
      chalk`npx exagent skills:{dim <action>}`,
      [
        chalk`{bold skills:sync}              Link the skills of the installed packages {dim (npx exagent skills)}`,
        chalk`{bold skills:list}              List the skills the installed packages ship`,
        chalk`{bold skills:show} <package> [skill]  Print the SKILL.md contents of a package`,
        chalk`{bold skills:clean}             Remove the managed skill links`,
        '',
        `--agent <agent>          Link skills for specific agents (can be used multiple times)`,
        `--dry-run                Print planned changes without modifying the project`,
        `--json                   Output the skill list as JSON (with ${'`'}list${'`'})`,
        `--no-followups           Skip the "Next (optional):" section of suggested follow-up commands`,
        `-h, --help               Usage info`,
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx exagent skills:sync -h` shows as fast as possible.
  const { logCmdError, CommandError } =
    require('../utils/errors') as typeof import('../utils/errors');
  const { findUpProjectRootOrAssert } =
    require('../utils/findUp') as typeof import('../utils/findUp');
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
    };

    switch (action) {
      case 'sync':
        return await skillsAsync.syncSkillsAsync(projectRoot, options);
      case 'list':
        return await skillsAsync.listSkillsAsync(projectRoot, { json: !!args['--json'] });
      case 'show': {
        const packageName = args._[1];
        if (!packageName) {
          throw new CommandError(
            'BAD_ARGS',
            `Missing package name. Usage: npx exagent skills:show <package> [skill]`
          );
        }
        return await skillsAsync.showSkillsAsync(projectRoot, packageName, args._[2]);
      }
      case 'clean':
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
