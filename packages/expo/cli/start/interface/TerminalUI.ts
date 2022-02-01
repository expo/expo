import chalk from 'chalk';

import * as Log from '../../log';
import { openInEditorAsync } from '../../utils/editor';
import { CI } from '../../utils/env';
import { logCmdError } from '../../utils/errors';
import { addInteractionListener, pauseInteractions } from '../../utils/prompts';
import * as Android from '../android/Android';
import * as Project from '../devServer';
import * as Simulator from '../ios/Simulator';
import { ensureWebSupportSetupAsync } from '../web/ensureWebSetup';
import * as Webpack from '../webpack/Webpack';
import * as WebpackDevServer from '../webpack/WebpackDevServer';
import { printHelp, printUsage, StartOptions } from './commandsTable';
import {
  openJsInspectorAsync,
  openMoreToolsAsync,
  printDevServerInfoAsync,
  reloadApp,
  toggleDevMenu,
} from './interactiveActions';

// import { loginOrRegisterIfLoggedOutAsync } from '../auth/accounts';
const CTRL_C = '\u0003';
const CTRL_D = '\u0004';
const CTRL_L = '\u000C';

const BLT = `\u203A`;

export async function startAsync(projectRoot: string, options: StartOptions) {
  const { stdin } = process;
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

  startWaitingForCommand();

  addInteractionListener(({ pause }) => {
    if (pause) {
      stopWaitingForCommand();
    } else {
      startWaitingForCommand();
    }
  });

  // setInteractiveAuthenticationCallback(async () => {
  //   stopWaitingForCommand();
  //   try {
  //     return await loginOrRegisterIfLoggedOutAsync();
  //   } finally {
  //     startWaitingForCommand();
  //   }
  // });

  await printDevServerInfoAsync(projectRoot, options);

  async function handleKeypress(key: string) {
    try {
      await handleKeypressAsync(key);
    } catch (err) {
      await logCmdError(err);
    }
  }

  async function handleKeypressAsync(key: string) {
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

    switch (key) {
      case 'A':
      case 'a':
        if (options.webOnly && !WebpackDevServer.isTargetingNative()) {
          Log.log(`${BLT} Opening the web project in Chrome on Android...`);
          const results = await Android.openWebProjectAsync(projectRoot, {
            shouldPrompt,
          });
          if (!results.success) {
            Log.error(results.error);
          }
        } else {
          const isDisabled = !platforms.includes('android');
          if (isDisabled) {
            Log.warn(
              `Android is disabled, enable it by adding ${chalk.bold`android`} to the platforms array in your app.json or app.config.js`
            );
            break;
          }

          Log.log(`${BLT} Opening on Android...`);
          const results = await Android.openProjectAsync(projectRoot, {
            shouldPrompt,
            devClient: options.devClient ?? false,
          });
          if (!results.success && results.error !== 'escaped') {
            Log.error(typeof results.error === 'string' ? results.error : results.error.message);
          }
        }
        printHelp();
        break;
      case 'I':
      case 'i':
        if (options.webOnly && !WebpackDevServer.isTargetingNative()) {
          Log.log(`${BLT} Opening the web project in Safari on iOS...`);
          const results = await Simulator.openWebProjectAsync(projectRoot, {
            shouldPrompt,
          });
          if (!results.success) {
            Log.error(results.error);
          }
        } else {
          const isDisabled = !platforms.includes('ios');
          if (isDisabled) {
            Log.warn(
              `iOS is disabled, enable it by adding ${chalk.bold`ios`} to the platforms array in your app.json or app.config.js`
            );
            break;
          }
          Log.log(`${BLT} Opening on iOS...`);
          const results = await Simulator.openProjectAsync(projectRoot, {
            shouldPrompt,
            devClient: options.devClient ?? false,
          });
          if (!results.success && results.error !== 'escaped') {
            Log.error(results.error);
          }
        }
        printHelp();
        break;
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
          await Project.startAsync(projectRoot, { webOnly: true });
          // When this is the first time webpack is started, reprint the connection info.
          await printDevServerInfoAsync(projectRoot, options);
        }

        Log.log(`${BLT} Open in the web browser...`);
        await Webpack.openAsync(projectRoot);
        printHelp();
        break;
      }
      case 'c':
        Log.clear();
        return await printDevServerInfoAsync(projectRoot, options);
      case 'j':
        return await openJsInspectorAsync();
      case 'r':
        return reloadApp();
      case 'o':
        Log.log(`${BLT} Opening the editor...`);
        return await openInEditorAsync(projectRoot, process.env.EXPO_EDITOR);
    }
  }
}
