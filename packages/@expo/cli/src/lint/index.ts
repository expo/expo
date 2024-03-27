import type { Command } from '../../bin/cli';
import { assertArgs, getProjectRoot, printHelp } from '../utils/args';
import { logCmdError } from '../utils/errors';

export const expoLint: Command = async (argv) => {
  const args = assertArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    argv
  );

  if (args['--help']) {
    printHelp(
      'Utility for setting up linting on an Expo project',
      'npx expo lint',
      '-h, --help                 Usage info'
    );
  }

  // Load modules after the help prompt so `npx expo lint -h` shows as fast as possible.
  const { lintAsync } = await import('./lintAsync.js');
  const projectRoot = getProjectRoot(args);

  return lintAsync(projectRoot).catch(logCmdError);
};
