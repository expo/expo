import assert from 'assert';
import chalk from 'chalk';

import { BLT, printHelp, printItem, printQRCode, printUsage, StartOptions } from './commandsTable';
import * as Log from '../../log';
import { delayAsync } from '../../utils/delay';
import { learnMore } from '../../utils/link';
import { openBrowserAsync } from '../../utils/open';
import { ExpoChoice, selectAsync } from '../../utils/prompts';
import { DevServerManager } from '../server/DevServerManager';
import {
  addReactDevToolsReloadListener,
  startReactDevToolsProxyAsync,
} from '../server/ReactDevToolsProxy';
import {
  openJsInspector,
  queryAllInspectorAppsAsync,
} from '../server/middleware/inspector/JsInspector';

const debug = require('debug')('expo:start:interface:interactiveActions') as typeof console.log;

interface MoreToolMenuItem extends ExpoChoice<string> {
  action?: () => unknown;
}

/** Wraps the DevServerManager and adds an interface for user actions. */
export class DevServerManagerActions {
  constructor(private devServerManager: DevServerManager) {}

  printDevServerInfo(
    options: Pick<StartOptions, 'devClient' | 'isWebSocketsEnabled' | 'platforms'>
  ) {
    // If native dev server is running, print its URL.
    if (this.devServerManager.getNativeDevServerPort()) {
      const devServer = this.devServerManager.getDefaultDevServer();
      try {
        const nativeRuntimeUrl = devServer.getNativeRuntimeUrl()!;
        const interstitialPageUrl = devServer.getRedirectUrl();

        printQRCode(interstitialPageUrl ?? nativeRuntimeUrl);

        if (interstitialPageUrl) {
          Log.log(
            printItem(
              chalk`Choose an app to open your project at {underline ${interstitialPageUrl}}`
            )
          );
        }
        Log.log(printItem(chalk`Metro waiting on {underline ${nativeRuntimeUrl}}`));
        if (options.devClient === false) {
          // TODO: if development build, change this message!
          Log.log(
            printItem('Scan the QR code above with Expo Go (Android) or the Camera app (iOS)')
          );
        } else {
          Log.log(
            printItem(
              'Scan the QR code above to open the project in a development build. ' +
                learnMore('https://expo.fyi/start')
            )
          );
        }
      } catch (error) {
        console.log('err', error);
        // @ts-ignore: If there is no development build scheme, then skip the QR code.
        if (error.code !== 'NO_DEV_CLIENT_SCHEME') {
          throw error;
        } else {
          const serverUrl = devServer.getDevServerUrl();
          Log.log(printItem(chalk`Metro waiting on {underline ${serverUrl}}`));
          Log.log(printItem(`Linking is disabled because the client scheme cannot be resolved.`));
        }
      }
    }

    const webDevServer = this.devServerManager.getWebDevServer();
    const webUrl = webDevServer?.getDevServerUrl({ hostType: 'localhost' });
    if (webUrl) {
      Log.log();
      Log.log(printItem(chalk`Web is waiting on {underline ${webUrl}}`));
    }

    printUsage(options, { verbose: false });
    printHelp();
    Log.log();
  }

  async openJsInspectorAsync() {
    Log.log('Opening JavaScript inspector in the browser...');
    const metroServerOrigin = this.devServerManager.getDefaultDevServer().getJsInspectorBaseUrl();
    assert(metroServerOrigin, 'Metro dev server is not running');
    const apps = await queryAllInspectorAppsAsync(metroServerOrigin);
    if (!apps.length) {
      Log.warn(
        `No compatible apps connected. JavaScript Debugging can only be used with the Hermes engine. ${learnMore(
          'https://docs.expo.dev/guides/using-hermes/'
        )}`
      );
      return;
    }
    try {
      for (const app of apps) {
        await openJsInspector(app);
      }
    } catch (error: any) {
      Log.error('Failed to open JavaScript inspector. This is often an issue with Google Chrome.');
      Log.exception(error);
    }
  }

  reloadApp() {
    Log.log(`${BLT} Reloading apps`);
    // Send reload requests over the dev servers
    this.devServerManager.broadcastMessage('reload');
  }

  async openMoreToolsAsync() {
    // Options match: Chrome > View > Developer
    try {
      const defaultMenuItems: MoreToolMenuItem[] = [
        { title: 'Inspect elements', value: 'toggleElementInspector' },
        { title: 'Toggle performance monitor', value: 'togglePerformanceMonitor' },
        { title: 'Toggle developer menu', value: 'toggleDevMenu' },
        { title: 'Reload app', value: 'reload' },
        {
          title: 'Open React devtools',
          value: 'openReactDevTools',
          action: this.openReactDevToolsAsync,
        },
        // TODO: Maybe a "View Source" option to open code.
      ];
      const pluginMenuItems = (
        await this.devServerManager.devtoolsPluginManager.queryPluginsAsync()
      ).map((plugin) => ({
        title: chalk`Open devtools plugin - {bold ${plugin.packageName}}`,
        value: `devtoolsPlugin:${plugin.packageName}`,
        action: async () => {
          const url = new URL(
            plugin.webpageEndpoint,
            this.devServerManager
              .getDefaultDevServer()
              .getUrlCreator()
              .constructUrl({ scheme: 'http' })
          );
          await openBrowserAsync(url.toString());
        },
      }));
      const menuItems = [...defaultMenuItems, ...pluginMenuItems];
      const value = await selectAsync(chalk`Dev tools {dim (native only)}`, menuItems);
      const menuItem = menuItems.find((item) => item.value === value);
      if (menuItem?.action) {
        menuItem.action();
      } else if (menuItem?.value) {
        this.devServerManager.broadcastMessage('sendDevCommand', { name: menuItem.value });
      }
    } catch (error: any) {
      debug(error);
      // do nothing
    } finally {
      printHelp();
    }
  }

  async openReactDevToolsAsync() {
    await startReactDevToolsProxyAsync();
    const url = this.devServerManager.getDefaultDevServer().getReactDevToolsUrl();
    await openBrowserAsync(url);
    addReactDevToolsReloadListener(() => {
      this.reconnectReactDevTools();
    });
    this.reconnectReactDevTools();
  }

  async reconnectReactDevTools() {
    // Wait a little time for react-devtools to be initialized in browser
    await delayAsync(3000);
    this.devServerManager.broadcastMessage('sendDevCommand', { name: 'reconnectReactDevTools' });
  }

  toggleDevMenu() {
    Log.log(`${BLT} Toggling dev menu`);
    this.devServerManager.broadcastMessage('devMenu');
  }
}
