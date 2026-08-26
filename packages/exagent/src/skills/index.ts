import chalk from 'chalk';

import type { Command } from '../types';
import { assertWithOptionsArgs, printHelp, strayArgumentError } from '../utils/args';

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
    { argv, command: 'skills', positionalArgs: 'own' }
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
        // `show` prints the SKILL.md itself, which is the whole point of it, so it has no JSON form.
        `--json                   Print the result as one JSON object (${'`'}sync${'`'}, ${'`'}list${'`'}, ${'`'}clean${'`'})`,
        `--no-followups           Skip the "Suggested next:" section of suggested follow-up commands`,
        `-h, --help               Usage info`,
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx exagent skills:sync -h` shows as fast as possible.
  const { logCmdError, CommandError } =
    require('../utils/errors') as typeof import('../utils/errors');
  const { findUpProjectRootOrAssert } =
    require('../utils/findUp') as typeof import('../utils/findUp');
  // @ref llp/0020-not-an-expo-app.rfc.md — three of the four actions discover the skills the
  // *installed Expo packages* ship, so they act on the app; without `expo` they used to fail on
  // the module resolution itself and print a raw Node stack trace. `clean` is the exception below.
  const { assertExpoAppSync } = require('../project/expoApp') as typeof import('../project/expoApp');
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
          hint: `this command acts on the whole project. To read one package's skill, run "npx exagent skills:show ${stray[0]}".`,
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
            `Missing package name. Usage: npx exagent skills:show <package> [skill]`
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
