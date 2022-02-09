import chalk from 'chalk';

import * as Log from '../../log';
import { openInEditorAsync } from '../../utils/editor';
import { CI, EXPO_DEBUG } from '../../utils/env';
import { AbortCommandError, logCmdError } from '../../utils/errors';
import { addInteractionListener, pauseInteractions } from '../../utils/prompts';
import { ensureWebSupportSetupAsync } from '../doctor/web/ensureWebSetup';
import {
  ensureWebDevServerRunningAsync,
  getDefaultDevServer,
  getWebDevServer,
} from '../startDevServers';
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
  options: Pick<StartOptions, 'devClient' | 'isWebSocketsEnabled' | 'platforms'> & {
    stopAsync: () => Promise<void>;
  }
) {
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
        await options.stopAsync();

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
    const { platforms = ['ios', 'android', 'web'] } = options;

    if (['i', 'a'].includes(key.toLowerCase())) {
      const platform = key.toLowerCase() === 'i' ? 'ios' : 'android';

      const shouldPrompt = !CI && ['I', 'A'].includes(key);
      if (shouldPrompt) {
        Log.clear();
      }

      const server = getDefaultDevServer();

      const platformSettings: Record<
        string,
        { name: string; key: 'android' | 'ios'; launchTarget: 'emulator' | 'simulator' }
      > = {
        android: {
          name: `Android`,
          key: 'android',
          launchTarget: 'emulator',
        },
        ios: {
          name: `iOS`,
          key: 'ios',
          launchTarget: 'simulator',
        },
      };

      const settings = platformSettings[platform];

      Log.log(`${BLT} Opening on ${settings.name}...`);

      if (server.isTargetingNative() && !platforms.includes(settings.key)) {
        Log.warn(
          chalk`${settings.name} is disabled, enable it by adding {bold ${settings.key}} to the platforms array in your app.json or app.config.js`
        );
      } else {
        try {
          await server.openPlatformAsync(settings.launchTarget, { shouldPrompt });
          printHelp();
        } catch (e) {
          if (!(e instanceof AbortCommandError)) {
            Log.error(chalk.red(e.toString()) + (EXPO_DEBUG ? '\n' + chalk.gray(e.stack) : ''));
          }
        }
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
        if (!getWebDevServer()) {
          Log.debug('Starting up webpack dev server');
          await ensureWebDevServerRunningAsync(projectRoot);
          // When this is the first time webpack is started, reprint the connection info.
          printDevServerInfo(options);
        }

        Log.log(`${BLT} Open in the web browser...`);
        try {
          await getWebDevServer().openPlatformAsync('desktop');
          printHelp();
        } catch (e) {
          if (!(e instanceof AbortCommandError)) {
            Log.error(chalk.red(e.toString()) + (EXPO_DEBUG ? '\n' + chalk.gray(e.stack) : ''));
          }
        }
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
