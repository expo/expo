import spawnAsync from '@expo/spawn-async';
import path from 'path';
import process from 'process';

import { EXPO_DIR } from './Constants';

type Options = {
  cwd?: string;
  root?: string;
  stdio?: 'inherit' | 'pipe' | 'ignore';
};

export async function runExpoCliAsync(
  command: string,
  args: string[] = [],
  options: Options = {}
): Promise<void> {
  const configArgs = options.root ? ['--config', path.resolve(options.root, 'app.json')] : [];

  // Don't handle SIGINT/SIGTERM in this process...defer to expo-cli
  process.on('SIGINT', () => {});
  process.on('SIGTERM', () => {});

  await spawnAsync('expo', [command, ...args, ...configArgs], {
    cwd: options.cwd || options.root || EXPO_DIR,
    stdio: options.stdio || 'inherit',
    env: {
      ...process.env,
      EXPO_NO_DOCTOR: 'true',
    },
  });
}
