import bunyan from '@expo/bunyan';
import { runMetroDevServerAsync } from '@expo/dev-server';
import spawnAsync from '@expo/spawn-async';
import { LogUpdater, PackagerLogsStream, LogRecord, ProjectUtils } from '@expo/xdl';
import chalk from 'chalk';
import path from 'path';
import findLastIndex from 'lodash/findLastIndex';
import ProgressBar from 'progress';

import Logger from '../../Logger';
import { getProjectRoot, getProjectName } from '../helpers';
import { createMetroLogger } from './createMetroLogger';

type Platform = 'android' | 'ios' | 'web';

const CTRL_C = '\u0003';
const CTRL_D = '\u0004';

export async function runStoryProcessesAsync(packageName: string, platform: Platform) {
  const projectRoot = getProjectRoot(packageName);
  const command = `run:${platform}`;

  const { stdin } = process;

  await spawnAsync('expo', [command, '--no-bundler'], {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  if (!stdin.setRawMode) {
    throw new Error(`Must use Node 12 or higher`);
  }

  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');

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
