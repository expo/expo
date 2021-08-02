import spawnAsync from '@expo/spawn-async';

import { getProjectRoot } from '../helpers';

type Platform = 'android' | 'ios' | 'web';

export async function runStoryProcessesAsync(packageName: string, platform: Platform) {
  const projectRoot = getProjectRoot(packageName);
  const command = `run-${platform}`;

  await spawnAsync('react-native', [command, '--no-packager'], {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  const { child: packagerProcess } = spawnAsync('yarn', ['react-native', 'start'], {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  const { child: storiesProcess } = spawnAsync('yarn', ['stories'], {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  [`SIGTERM`, `SIGTERM`].forEach((eventType: any) => {
    process.on(eventType, () => {
      packagerProcess.kill(eventType);
      storiesProcess.kill(eventType);
      process.exit(1);
    });
  });
}
