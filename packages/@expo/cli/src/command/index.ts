import chalk from 'chalk';

import type { Command } from '../index';
import { getHelp as getEventsHelp } from './events/help';
import { getHelp as getPsHelp } from './ps/help';
import { reportError } from './utils';

export const expoCommand: Command = async (argv = []) => {
  const [command, ...args] = argv;

  if (!command || command === '--help' || command === '-h') {
    process.stdout.write(
      [
        '',
        chalk`  {bold Info}`,
        '    Inspect recorded command sessions and their structured events.',
        '',
        chalk`  {bold Usage}`,
        chalk`    {dim $} npx expo command {dim <ps|events>}`,
        getPsHelp(false),
        getEventsHelp(false),
        '    Run npx expo command <ps|events> --help for the full argument list.',
        '    The command:ps and command:events forms are also supported.',
        '',
      ].join('\n')
    );
    return;
  }

  try {
    switch (command) {
      case 'ps': {
        const { expoCommandPs } = await import('./ps/index.js');
        return await expoCommandPs(args);
      }
      case 'events': {
        const { expoCommandEvents } = await import('./events/index.js');
        return await expoCommandEvents(args);
      }
      default:
        throw new Error(`Unknown command: ${command}. Run \`npx expo command --help\` for usage.`);
    }
  } catch (error) {
    reportError(error);
  }
};
