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
  let rootDir = options.root || process.cwd();
  let appJsonPath = path.resolve(rootDir, 'app.json');

  // // Don't handle SIGINT/SIGTERM in this process...defer to exp
  process.on('SIGINT', () => {});
  process.on('SIGTERM', () => {});

  await spawnAsync('expo', [command, ...args, '--config', appJsonPath], {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      EXPO_NO_DOCTOR: 'true',
    },
  });
}
