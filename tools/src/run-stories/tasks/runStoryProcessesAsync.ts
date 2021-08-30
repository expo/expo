import { runMetroDevServerAsync } from '@expo/dev-server';
import spawnAsync from '@expo/spawn-async';
import path from 'path';

import Logger from '../../Logger';
import { getProjectRoot, getProjectName } from '../helpers';
import { createMetroLogger } from './createMetroLogger';

type Platform = 'android' | 'ios' | 'web';

const CTRL_C = '\u0003';
const CTRL_D = '\u0004';

// Runs `expo run:ios|android` to build the app w/ nice logging
// Starts a metro dev server and an expo stories server
export async function runStoryProcessesAsync(packageName: string, platform: Platform) {
  if (platform === 'web') {
    runWebProcesses(packageName);
  } else if (platform === 'ios' || platform === 'android') {
    runMetroProcesses(packageName, platform);
  }
}

async function runMetroProcesses(packageName: string, platform: Platform) {
  const projectRoot = getProjectRoot(packageName);

  const command = `run:${platform}`;

  const { stdin } = process;

  if (!stdin.setRawMode) {
    throw new Error(`Must use Node 12 or higher`);
  }

  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');

  await spawnAsync('expo', [command, '--no-bundler'], {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  const logger = createMetroLogger(projectRoot);

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
  Logger.log();
  Logger.log(`Press 'r' to reload`);
  Logger.log(`Press 'i' to open project in Xcode`);
  Logger.log(`Press 'a' to open project in Android Studio`);
  Logger.log();

  stdin.on('data', async (data) => {
    if (data === 'r') {
      messageSocket.broadcast('reload');
    }

    if (data === 'm') {
      messageSocket.broadcast('devMenu');
    }

    if (data === 'i') {
      const projectName = getProjectName(projectRoot);
      const pathToIos = path.resolve(projectRoot, 'ios', `${projectName}.xcworkspace`);
      // @ts-ignore
      const xcodeAppName = process.XCODE_EDITOR_NAME || 'Xcode.app';

      Logger.log(`Opening project in ${xcodeAppName}...`);
      await spawnAsync('open', [pathToIos, '-a', xcodeAppName as string]);
    }

    if (data === 'a') {
      const pathToAndroid = path.resolve(projectRoot, 'android');
      // @ts-ignore
      const androidStudioName = process.ANDROID_STUDIO_EDITOR_NAME || 'Android Studio.app';

      Logger.log(`Opening project in ${androidStudioName}...`);
      await spawnAsync('open', [pathToAndroid, '-a', androidStudioName as string]);
    }

    if (data === CTRL_C || data === CTRL_D) {
      storiesProcess.kill('SIGTERM');
      process.exit(1);
    }
  });
}

async function runWebProcesses(packageName: string) {
  const projectRoot = getProjectRoot(packageName);

  spawnAsync('expo', ['start', '--web'], {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  const { child: storiesProcess } = spawnAsync('yarn', ['stories'], {
    cwd: projectRoot,
    stdio: ['ignore', 'ignore', process.stderr],
  });

  process.on('SIGBREAK', () => {
    if (storiesProcess) {
      storiesProcess.kill('SIGINT');
    }

    process.exit(1);
  });

  process.on('SIGINT', () => {
    if (storiesProcess) {
      storiesProcess.kill('SIGINT');
    }
    process.exit(1);
  });
}
