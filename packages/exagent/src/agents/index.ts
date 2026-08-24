import chalk from 'chalk';

import type { Command } from '../types';
import { assertWithOptionsArgs, printHelp } from '../utils/args';

export const exagentAgentsSetup: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      '--json': Boolean,
      '--agent': [String],
      '--no-agents-md': Boolean,
      '--no-agent-skills': Boolean,
      '--no-checkpoint': Boolean,
      // Aliases
      '-h': '--help',
    },
    { argv, command: 'agents:setup', positionalArgs: 'none' }
  );

  if (args['--help']) {
    printHelp(
      `Set this project up for coding agents`,
      chalk`npx exagent agents:setup`,
      [
        `--agent <agent>     Set up for specific agents (can be used multiple times)`,
        `--no-agents-md      Do not create or update AGENTS.md`,
        `--no-agent-skills   Do not link the agent skills of the installed packages`,
        `--no-checkpoint     Skip the git snapshot taken before AGENTS.md is written`,
        `--json              Print the result as JSON`,
        `-h, --help          Usage info`,
      ].join('\n'),
      [
        '',
        chalk`  Two things, both safe to run again at any time:`,
        '',
        chalk`  1. Links the agent skills the installed packages ship, like {bold npx exagent skills:sync}.`,
        chalk`  2. Maintains one managed block in the project's {bold AGENTS.md}: what this project is,`,
        chalk`     whether Expo Go can run it, and the commands that answer in a machine-readable shape.`,
        '',
        chalk`  Everything outside the block markers is yours and is left untouched. {bold CLAUDE.md} is`,
        chalk`  never written; when one exists that does not reference AGENTS.md, the command says so.`,
        '',
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx exagent agents:setup -h` shows as fast as possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  const { findUpProjectRootOrAssert } =
    require('../utils/findUp') as typeof import('../utils/findUp');
  const { printSetupAsync } = require('./setupAsync') as typeof import('./setupAsync');

  return (async () => {
    const projectRoot = findUpProjectRootOrAssert(process.cwd());
    await printSetupAsync(projectRoot, {
      agents: args['--agent'] ?? [],
      agentsMd: !args['--no-agents-md'],
      agentSkills: !args['--no-agent-skills'],
      json: !!args['--json'],
      checkpoint: !args['--no-checkpoint'],
    });
  })().catch(logCmdError);
};
