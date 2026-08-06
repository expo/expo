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
        chalk`[action]                 Action to perform: sync, list, clean {dim (default: sync)}`,
        `--agent <agent>          Link skills for specific agents (can be used multiple times)`,
        `--dry-run                Print planned changes without modifying the project`,
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
        return await skillsAsync.listSkillsAsync(projectRoot);
      case 'clean':
        return await skillsAsync.cleanSkillsAsync(projectRoot, options);
      default:
        throw new CommandError(
          'BAD_ARGS',
          `Unknown action: ${action}. Expected one of: sync, list, clean`
        );
    }
  } catch (error: any) {
    logCmdError(error);
  }
};
