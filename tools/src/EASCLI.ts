import spawnAsync from '@expo/spawn-async';
import process from 'process';

import { EXPO_DIR } from './Constants';

type Options = {
  cwd?: string;
  stdio?: 'inherit' | 'pipe' | 'ignore';
};

export async function runEASCliAsync(
  command: string,
  args: string[] = [],
  options: Options = {}
): Promise<string> {
  // Don't handle SIGINT/SIGTERM in this process...defer to expo-cli
  process.on('SIGINT', () => {});
  process.on('SIGTERM', () => {});

  const result = await spawnAsync('eas', [command, ...args], {
    cwd: options.cwd || EXPO_DIR,
    env: {
      ...process.env,
      EXPO_NO_DOCTOR: 'true',
    },
  });

  return result.stdout;
}
