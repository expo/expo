import chalk from 'chalk';

import * as Log from '../../log';
import { openInEditorAsync } from '../../utils/editor';
import { CI, EXPO_DEBUG } from '../../utils/env';
import { AbortCommandError, logCmdError } from '../../utils/errors';
import { addInteractionListener, pauseInteractions } from '../../utils/prompts';
import ProcessSettings from '../api/ProcessSettings';
import { startDevServersAsync } from '../devServer';
import { ensureWebSupportSetupAsync } from '../doctor/web/ensureWebSetup';
import { AndroidPlatformManager } from '../platforms/android/AndroidPlatformManager';
import { ApplePlatformManager } from '../platforms/ios/ApplePlatformManager';
import * as Webpack from '../webpack/Webpack';
import * as WebpackDevServer from '../webpack/WebpackDevServer';
import { BLT, printHelp, printUsage, StartOptions } from './commandsTable';
import {
  openJsInspectorAsync,
  openMoreToolsAsync,
  printDevServerInfo,
  reloadApp,
  toggleDevMenu,
} from './interactiveActions';

const CTRL_C = '\u0003';
const CTRL_D = '\u0004';
const CTRL_L = '\u000C';

export async function startInterfaceAsync(
  projectRoot: string,
  options: Pick<StartOptions, 'isWebSocketsEnabled' | 'webOnly' | 'platforms'>
) {
  const { stdin } = process;

  const android = new AndroidPlatformManager(projectRoot);
  const apple = new ApplePlatformManager(projectRoot);

  const startWaitingForCommand = () => {
    if (!stdin.setRawMode) {
      Log.warn('Non-interactive terminal, keyboard commands are disabled.');
      return;
    }
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    stdin.on('data', handleKeypress);
  };

  const stopWaitingForCommand = () => {
    stdin.removeListener('data', handleKeypress);
    if (!stdin.setRawMode) {
      Log.warn('Non-interactive terminal, keyboard commands are disabled.');
      return;
    }
    stdin.setRawMode(false);
    stdin.resume();
  };

  const handleKeypress = async (key: string) => {
    try {
      await handleKeypressAsync(key);
    } catch (err) {
      await logCmdError(err);
    }
  };

  const handleKeypressAsync = async (key: string) => {
    // Auxillary commands all escape.
    switch (key) {
      case CTRL_C:
      case CTRL_D:
        // @ts-ignore: Argument of type '"SIGINT"' is not assignable to parameter of type '"disconnect"'.
        process.emit('SIGINT');
        // Prevent terminal UI from accepting commands while the process is closing.
        // Without this, fast typers will close the server then start typing their
        // next command and have a bunch of unrelated things pop up.
        return pauseInteractions();
      case CTRL_L:
        return Log.clear();
      case '?':
        return await printUsage(options, { verbose: true });
    }

    // Optionally enabled
    if (options.isWebSocketsEnabled) {
      switch (key) {
        case 'm':
          return toggleDevMenu();
        case 'M':
          return await openMoreToolsAsync();
      }
    }

    const shouldPrompt = !CI && ['I', 'A'].includes(key);
    if (shouldPrompt) {
      Log.clear();
    }
    const { platforms = ['ios', 'android', 'web'] } = options;

    const handleOpenError = (e: Error) => {
      if (!(e instanceof AbortCommandError)) {
        Log.error(chalk.red(e.toString()) + (EXPO_DEBUG ? '\n' + chalk.gray(e.stack) : ''));
      }
    };
    switch (key) {
      case 'A':
      case 'a': {
        let runtime: 'web' | 'custom' | 'expo';
        if (options.webOnly && !WebpackDevServer.isTargetingNative()) {
          Log.log(`${BLT} Opening the web project in Chrome on Android...`);
          runtime = 'web';
        } else {
          const isDisabled = !platforms.includes('android');
          if (isDisabled) {
            Log.warn(
              `Android is disabled, enable it by adding ${chalk.bold`android`} to the platforms array in your app.json or app.config.js`
            );
            break;
          }
          runtime = ProcessSettings.devClient ? 'custom' : 'expo';
          Log.log(`${BLT} Opening on Android...`);
        }
        await android
          .openAsync(
            {
              runtime,
            },
            { shouldPrompt }
          )
          .catch(handleOpenError);
        printHelp();
        break;
      }
      case 'I':
      case 'i': {
        let runtime: 'web' | 'custom' | 'expo';

        if (options.webOnly && !WebpackDevServer.isTargetingNative()) {
          Log.log(`${BLT} Opening the web project in Safari on iOS...`);
          runtime = 'web';
        } else {
          const isDisabled = !platforms.includes('ios');
          if (isDisabled) {
            Log.warn(
              `iOS is disabled, enable it by adding ${chalk.bold`ios`} to the platforms array in your app.json or app.config.js`
            );
            break;
          }
          Log.log(`${BLT} Opening on iOS...`);
          runtime = ProcessSettings.devClient ? 'custom' : 'expo';
        }
        await apple
          .openAsync(
            {
              runtime,
            },
            { shouldPrompt }
          )
          .catch(handleOpenError);
        printHelp();
        break;
      }
    }

    switch (key) {
      case 'w': {
        try {
          if (await ensureWebSupportSetupAsync(projectRoot)) {
            if (!platforms.includes('web')) {
              platforms.push('web');
              options.platforms?.push('web');
            }
          }
        } catch (e: any) {
          Log.warn(e.message);
          break;
        }

        const isDisabled = !platforms.includes('web');
        if (isDisabled) {
          Log.debug('Web is disabled');
          // Use warnings from the web support setup.
          break;
        }

        // Ensure the Webpack dev server is running first
        const isStarted = WebpackDevServer.getDevServerUrl();
        if (!isStarted) {
          Log.debug('Starting up webpack dev server');
          await startDevServersAsync(projectRoot, { webOnly: true });
          // When this is the first time webpack is started, reprint the connection info.
          printDevServerInfo(options);
        }

        Log.log(`${BLT} Open in the web browser...`);
        await Webpack.openAsync(projectRoot);
        printHelp();
        break;
      }
      case 'c':
        Log.clear();
        return printDevServerInfo(options);
      case 'j':
        return await openJsInspectorAsync();
      case 'r':
        return reloadApp();
      case 'o':
        Log.log(`${BLT} Opening the editor...`);
        return await openInEditorAsync(projectRoot, process.env.EXPO_EDITOR);
    }
  };

  // Start...

  printDevServerInfo(options);

  addInteractionListener(({ pause }) => {
    if (pause) {
      stopWaitingForCommand();
    } else {
      startWaitingForCommand();
    }
  });

  startWaitingForCommand();
}
