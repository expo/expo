import { printCommandHelp } from '../help/format';
import type { CommandHelp } from '../help/types';
import { PROGRAM_PREFIX } from '../programName';
import type { Command } from '../types';
import { assertWithOptionsArgs } from '../utils/args';

export const agentsSetupHelp: CommandHelp = {
  command: 'agents:setup',
  usage: `${PROGRAM_PREFIX} agents:setup`,
  options: [
    `--agent <agent>     Set up for specific agents (can be used multiple times)`,
    `--no-agents-md      Do not create or update AGENTS.md`,
    `--no-agent-skills   Do not link the agent skills of the installed packages`,
    `--json              Print the result as JSON`,
    `-h, --help          Usage info`,
  ],
  examples: [
    {
      run: `${PROGRAM_PREFIX} agents:setup`,
      gets: 'AGENTS.md gets a managed block, and the installed packages’ skills are linked',
    },
    {
      run: `${PROGRAM_PREFIX} agents:setup --agent claude --json`,
      gets: 'the same for one agent, as one object',
    },
    {
      run: `${PROGRAM_PREFIX} agents:setup --no-agents-md`,
      gets: 'the skill links only; AGENTS.md is left alone',
    },
  ],
  next: ['skills:list', 'status', 'dev'],
  json: {
    stdout: 'one object, and nothing else',
    stderr: 'progress and errors',
    keys: ['projectRoot', 'skills', 'agentsMd', 'agents', 'notes'],
  },
  notes: [
    `Safe to run again at any time. Everything outside the AGENTS.md block markers is yours and`,
    `is left untouched, and CLAUDE.md is never written.`,
  ],
};

export const agentCliAgentsSetup: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      '--json': Boolean,
      '--agent': [String],
      '--no-agents-md': Boolean,
      '--no-agent-skills': Boolean,
      // Aliases
      '-h': '--help',
    },
    { argv, command: 'agents:setup', positionalArgs: 'none' }
  );

  if (args['--help']) {
    printCommandHelp(agentsSetupHelp);
  }

  // Load modules after the help prompt so `npx @expo/agent-cli agents:setup -h` shows as fast as possible.
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  // @ref llp/0004-smart-start-and-project-state.rfc.md §Not an Expo app — this command reads the skills the installed Expo
  // packages ship and writes links into the project, so it acts on the app. Without `expo` it used
  // to fail on the module resolution itself and print a raw Node stack trace.
  const { findUpExpoAppRootOrAssert } =
    require('../project/expoApp') as typeof import('../project/expoApp');
  const { printSetupAsync } = require('./setupAsync') as typeof import('./setupAsync');

  return (async () => {
    const projectRoot = findUpExpoAppRootOrAssert(process.cwd());
    await printSetupAsync(projectRoot, {
      agents: args['--agent'] ?? [],
      agentsMd: !args['--no-agents-md'],
      agentSkills: !args['--no-agent-skills'],
      json: !!args['--json'],
    });
  })().catch(logCmdError);
};
