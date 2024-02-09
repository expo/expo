import chalk from 'chalk';

import { KeyPressHandler } from './KeyPressHandler';
import { BLT, printHelp, printUsage, StartOptions } from './commandsTable';
import { DevServerManagerActions } from './interactiveActions';
import * as Log from '../../log';
import { openInEditorAsync } from '../../utils/editor';
import { AbortCommandError } from '../../utils/errors';
import { getAllSpinners, ora } from '../../utils/ora';
import { getProgressBar, setProgressBar } from '../../utils/progress';
import { addInteractionListener, pauseInteractions } from '../../utils/prompts';
import { WebSupportProjectPrerequisite } from '../doctor/web/WebSupportProjectPrerequisite';
import { DevServerManager } from '../server/DevServerManager';

const debug = require('debug')('expo:start:interface:startInterface') as typeof console.log;

const CTRL_C = '\u0003';
const CTRL_D = '\u0004';
const CTRL_L = '\u000C';

const PLATFORM_SETTINGS: Record<
  string,
  { name: string; key: 'android' | 'ios'; launchTarget: 'emulator' | 'simulator' }
> = {
  android: {
    name: 'Android',
    key: 'android',
    launchTarget: 'emulator',
  },
  ios: {
    name: 'iOS',
    key: 'ios',
    launchTarget: 'simulator',
  },
};

export async function startInterfaceAsync(
  devServerManager: DevServerManager,
  options: Pick<StartOptions, 'devClient' | 'platforms'>
) {
  const actions = new DevServerManagerActions(devServerManager, options);

  const isWebSocketsEnabled = devServerManager.getDefaultDevServer()?.isTargetingNative();

  const usageOptions = {
    isWebSocketsEnabled,
    devClient: devServerManager.options.devClient,
    ...options,
  };

  actions.printDevServerInfo(usageOptions);

  const onPressAsync = async (key: string) => {
    // Auxillary commands all escape.
    switch (key) {
      case CTRL_C:
      case CTRL_D: {
        // Prevent terminal UI from accepting commands while the process is closing.
        // Without this, fast typers will close the server then start typing their
        // next command and have a bunch of unrelated things pop up.
        pauseInteractions();

        const spinners = getAllSpinners();
        spinners.forEach((spinner) => {
          spinner.fail();
        });

        const currentProgress = getProgressBar();
        if (currentProgress) {
          currentProgress.terminate();
          setProgressBar(null);
        }
        const spinner = ora({ text: 'Stopping server', color: 'white' }).start();
        try {
          await devServerManager.stopAsync();
          spinner.stopAndPersist({ text: 'Stopped server', symbol: `\u203A` });
          // @ts-ignore: Argument of type '"SIGINT"' is not assignable to parameter of type '"disconnect"'.
          process.emit('SIGINT');

          // TODO: Is this the right place to do this?
          process.exit();
        } catch (error) {
          spinner.fail('Failed to stop server');
          throw error;
        }
        break;
      }
      case CTRL_L:
        return Log.clear();
      case '?':
        return printUsage(usageOptions, { verbose: true });
    }

    // Optionally enabled

    if (isWebSocketsEnabled) {
      switch (key) {
        case 'm':
          return actions.toggleDevMenu();
        case 'M':
          return actions.openMoreToolsAsync();
      }
    }

    const { platforms = ['ios', 'android', 'web'] } = options;

    if (['i', 'a'].includes(key.toLowerCase())) {
      const platform = key.toLowerCase() === 'i' ? 'ios' : 'android';

      const shouldPrompt = ['I', 'A'].includes(key);
      if (shouldPrompt) {
        Log.clear();
      }

      const server = devServerManager.getDefaultDevServer();
      const settings = PLATFORM_SETTINGS[platform];

      Log.log(`${BLT} Opening on ${settings.name}...`);

      if (server.isTargetingNative() && !platforms.includes(settings.key)) {
        Log.warn(
          chalk`${settings.name} is disabled, enable it by adding {bold ${settings.key}} to the platforms array in your app.json or app.config.js`
        );
      } else {
        try {
          await server.openPlatformAsync(settings.launchTarget, { shouldPrompt });
          printHelp();
        } catch (error: any) {
          if (!(error instanceof AbortCommandError)) {
            Log.exception(error);
          }
        }
      }
      // Break out early.
      return;
    }

    switch (key) {
      case 's': {
        Log.clear();
        if (await devServerManager.toggleRuntimeMode()) {
          usageOptions.devClient = devServerManager.options.devClient;
          return actions.printDevServerInfo(usageOptions);
        }
        break;
      }
      case 'w': {
        try {
          await devServerManager.ensureProjectPrerequisiteAsync(WebSupportProjectPrerequisite);
          if (!platforms.includes('web')) {
            platforms.push('web');
            options.platforms?.push('web');
          }
        } catch (e: any) {
          Log.warn(e.message);
          break;
        }

        const isDisabled = !platforms.includes('web');
        if (isDisabled) {
          debug('Web is disabled');
          // Use warnings from the web support setup.
          break;
        }

        // Ensure the Webpack dev server is running first
        if (!devServerManager.getWebDevServer()) {
          debug('Starting up webpack dev server');
          await devServerManager.ensureWebDevServerRunningAsync();
          // When this is the first time webpack is started, reprint the connection info.
          actions.printDevServerInfo(usageOptions);
        }

        Log.log(`${BLT} Open in the web browser...`);
        try {
          await devServerManager.getWebDevServer()?.openPlatformAsync('desktop');
          printHelp();
        } catch (error: any) {
          if (!(error instanceof AbortCommandError)) {
            Log.exception(error);
          }
        }
        break;
      }
      case 'c':
        Log.clear();
        return actions.printDevServerInfo(usageOptions);
      case 'j':
        return actions.openJsInspectorAsync();
      case 'r':
        return actions.reloadApp();
      case 'o':
        Log.log(`${BLT} Opening the editor...`);
        return openInEditorAsync(devServerManager.projectRoot);
    }
  };

  const keyPressHandler = new KeyPressHandler(onPressAsync);

  const listener = keyPressHandler.createInteractionListener();

  addInteractionListener(listener);

  // Start observing...
  keyPressHandler.startInterceptingKeyStrokes();
}
