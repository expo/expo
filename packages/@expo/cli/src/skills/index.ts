#!/usr/bin/env node
import chalk from 'chalk';

import type { Command } from '../index';
import { assertWithOptionsArgs, printHelp } from '../utils/args';

export const expoSkills: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      '--dry-run': Boolean,
      '--json': Boolean,
      '--agent': [String],
      // Aliases
      '-h': '--help',
    },
    { argv }
  );

  if (args['--help']) {
    printHelp(
      `Link agent skills from installed npm packages`,
      chalk`npx expo skills {dim [action]}`,
      [
        chalk`[action]                 Action to perform: sync, list, show, clean {dim (default: sync)}`,
        chalk`{dim $} npx expo skills show <package> [skill]  Print SKILL.md contents of a package`,
        `--agent <agent>          Link skills for specific agents (can be used multiple times)`,
        `--dry-run                Print planned changes without modifying the project`,
        `--json                   Output the skill list as JSON (with ${'`'}list${'`'})`,
        `-h, --help               Usage info`,
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx expo skills -h` shows as fast as possible.
  const { logCmdError, CommandError } =
    require('../utils/errors') as typeof import('../utils/errors');
  const { findUpProjectRootOrAssert } =
    require('../utils/findUp') as typeof import('../utils/findUp');
  const skillsAsync = require('./skillsAsync') as typeof import('./skillsAsync');

  try {
    const projectRoot = findUpProjectRootOrAssert(process.cwd());
    const action = args._[0] ?? 'sync';
    const options = {
      agents: args['--agent'] ?? [],
      dryRun: !!args['--dry-run'],
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
            `Missing package name. Usage: npx expo skills show <package> [skill]`
          );
        }
        return await skillsAsync.showSkillsAsync(projectRoot, packageName, args._[2]);
      }
      case 'clean':
        return await skillsAsync.cleanSkillsAsync(projectRoot, options);
      default:
        throw new CommandError(
          'BAD_ARGS',
          `Unknown action: ${action}. Expected one of: sync, list, show, clean`
        );
    }
  } catch (error: any) {
    logCmdError(error);
  }
};
