import path from 'path';
import process from 'process';
import spawnAsync from '@expo/spawn-async';

type Options = {
  root?: string;
  useUnversioned: boolean;
};

export async function runExpoCliAsync(
  command: string,
  args: string[] = [],
  options: Options = { useUnversioned: true }
): Promise<void> {
  let configArgs = options.root ? ['--config', path.resolve(options.root, 'app.json')] : [];

  // Don't handle SIGINT/SIGTERM in this process...defer to expo-cli
  process.on('SIGINT', () => {});
  process.on('SIGTERM', () => {});

  await spawnAsync('expo', [command, ...args, ...configArgs], {
    cwd: options.root || process.cwd(),
    stdio: 'inherit',
    env: {
      ...process.env,
      EXPO_NO_DOCTOR: 'true',
    },
  });
}
