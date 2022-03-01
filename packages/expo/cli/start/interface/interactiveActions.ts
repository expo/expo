import { openJsInspector, queryAllInspectorAppsAsync } from '@expo/dev-server';
import assert from 'assert';
import chalk from 'chalk';

import * as Log from '../../log';
import { learnMore } from '../../utils/link';
import { selectAsync } from '../../utils/prompts';
import { DevServerManager } from '../server/DevServerManager';
import { BLT, printHelp, printItem, printQRCode, printUsage, StartOptions } from './commandsTable';

/** Wraps the DevServerManager and adds an interface for user actions. */
export class DevServerManagerActions {
  constructor(private devServerManager: DevServerManager) {}

  printDevServerInfo(
    options: Pick<StartOptions, 'devClient' | 'isWebSocketsEnabled' | 'platforms'>
  ) {
    // If native dev server is running, print its URL.
    if (this.devServerManager.getNativeDevServerPort()) {
      try {
        const url = this.devServerManager.getDefaultDevServer().getNativeRuntimeUrl();

        printQRCode(url);
        Log.log(printItem(`Metro waiting on ${chalk.underline(url)}`));
        // TODO: if development build, change this message!
        Log.log(printItem(`Scan the QR code above with Expo Go (Android) or the Camera app (iOS)`));
      } catch (error) {
        // @ts-ignore: If there is no development build scheme, then skip the QR code.
        if (error.code !== 'NO_DEV_CLIENT_SCHEME') {
          throw error;
        } else {
          const serverUrl = this.devServerManager.getDefaultDevServer().getDevServerUrl();
          Log.log(printItem(`Metro waiting on ${chalk.underline(serverUrl)}`));
          Log.log(printItem(`Linking is disabled because the client scheme cannot be resolved.`));
        }
      }
    }

    const webUrl = this.devServerManager
      .getWebDevServer()
      ?.getDevServerUrl({ hostType: 'localhost' });
    if (webUrl) {
      Log.log();
      Log.log(printItem(`Webpack waiting on ${chalk.underline(webUrl)}`));
      Log.log(
        chalk.gray(printItem(`Expo Webpack (web) is in beta, and subject to breaking changes!`))
      );
    }

    printUsage(options, { verbose: false });
    printHelp();
    Log.log();
  }

  async openJsInspectorAsync() {
    Log.log(`Opening JavaScript inspector in the browser...`);
    const port = this.devServerManager.getNativeDevServerPort();
    assert(port, 'Metro dev server is not running');
    const metroServerOrigin = `http://localhost:${port}`;
    const apps = await queryAllInspectorAppsAsync(metroServerOrigin);
    if (!apps.length) {
      Log.warn(
        `No compatible apps connected. This feature is only available for apps using the Hermes runtime. ${learnMore(
          'https://docs.expo.dev/guides/using-hermes/'
        )}`
      );
      return;
    }
    for (const app of apps) {
      openJsInspector(app);
    }
  }

  reloadApp() {
    Log.log(`${BLT} Reloading apps`);
    // Send reload requests over the dev servers
    this.devServerManager.broadcastMessage('reload');
  }

  async openMoreToolsAsync() {
    try {
      // Options match: Chrome > View > Developer
      const value = await selectAsync(`Dev tools ${chalk.dim`(native only)`}`, [
        { title: 'Inspect elements', value: 'toggleElementInspector' },
        { title: 'Toggle performance monitor', value: 'togglePerformanceMonitor' },
        { title: 'Toggle developer menu', value: 'toggleDevMenu' },
        { title: 'Reload app', value: 'reload' },
        // TODO: Maybe a "View Source" option to open code.
        // Toggling Remote JS Debugging is pretty rough, so leaving it disabled.
        // { title: 'Toggle Remote Debugging', value: 'toggleRemoteDebugging' },
      ]);
      this.devServerManager.broadcastMessage('sendDevCommand', { name: value });
    } catch (e) {
      Log.debug(e);
      // do nothing
    } finally {
      printHelp();
    }
  }

  toggleDevMenu() {
    Log.log(`${BLT} Toggling dev menu`);
    this.devServerManager.broadcastMessage('devMenu');
  }
}
