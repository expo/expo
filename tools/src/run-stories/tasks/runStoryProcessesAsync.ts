import bunyan from '@expo/bunyan';
import { runMetroDevServerAsync } from '@expo/dev-server';
import spawnAsync from '@expo/spawn-async';

import Logger from '../../Logger';
import { getProjectRoot } from '../helpers';

type Platform = 'android' | 'ios' | 'web';

const CTRL_C = '\u0003';
const CTRL_D = '\u0004';

export async function runStoryProcessesAsync(packageName: string, platform: Platform) {
  const projectRoot = getProjectRoot(packageName);
  const command = `run-${platform}`;

  const { stdin } = process;

  await spawnAsync('react-native', [command, '--no-packager'], {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  if (!stdin.setRawMode) {
    throw new Error(`Must use Node 12 or higher`);
  }

  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');

  const logger = bunyan.createLogger({
    name: 'expo-stories',
    streams: [],
  });

  logger.addStream({
    stream: {
      write: (chunk: string) => {
        try {
          const c = JSON.parse(chunk);

          if (c.tag === 'metro') {
            if (!c.msg) {
              return;
            }

            const message = JSON.parse(c.msg);
            if (message.type === 'client_log' && message.data) {
              Logger.log(message.data.join('\n'));
            }
          }
        } catch (e) {}
      },
      level: 'debug',
    },
  });

  const { messageSocket } = await runMetroDevServerAsync(projectRoot, {
    port: 8081,
    logger,
  });

  const { child: storiesProcess } = spawnAsync('yarn', ['stories'], {
    cwd: projectRoot,
    stdio: 'ignore',
  });

  Logger.log();
  Logger.log(`Running stories for ${packageName}`);
  Logger.log(`Press 'r' to reload`);

  stdin.on('data', (data) => {
    if (data === 'r') {
      messageSocket.broadcast('reload');
    }

    if (data === 'm') {
      messageSocket.broadcast('devMenu');
    }

    if (data === CTRL_C || data === CTRL_D) {
      process.emit('SIGINT');
      storiesProcess.kill('SIGTERM');
      process.exit(1);
    }
  });
}
