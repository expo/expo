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
  MetroInspectorProxyApp,
  openJsInspector,
  queryAllInspectorAppsAsync,
} from '../server/middleware/inspector/JsInspector';

const debug = require('debug')('expo:start:interface:interactiveActions') as typeof console.log;

interface MoreToolMenuItem extends ExpoChoice<string> {
  action?: () => unknown;
}

/** Wraps the DevServerManager and adds an interface for user actions. */
export class DevServerManagerActions {
  constructor(
    private devServerManager: DevServerManager,
    private options: Pick<StartOptions, 'devClient' | 'platforms'>
  ) {}

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

    if (this.options.platforms?.includes('web')) {
      const webDevServer = this.devServerManager.getWebDevServer();
      const webUrl = webDevServer?.getDevServerUrl({ hostType: 'localhost' });
      if (webUrl) {
        Log.log();
        Log.log(printItem(chalk`Web is waiting on {underline ${webUrl}}`));
      }
    }

    printUsage(options, { verbose: false });
    printHelp();
    Log.log();
  }

  async openJsInspectorAsync() {
    const metroServerOrigin = this.devServerManager.getDefaultDevServer().getJsInspectorBaseUrl();
    const apps = await queryAllInspectorAppsAsync(metroServerOrigin);
    let app: MetroInspectorProxyApp | null = null;

    if (!apps.length) {
      return Log.warn(
        chalk`{bold Debug:} No compatible apps connected. JavaScript Debugging can only be used with the Hermes engine. ${learnMore(
          'https://docs.expo.dev/guides/using-hermes/'
        )}`
      );
    }

    if (apps.length === 1) {
      app = apps[0];
    } else {
      const choices = apps.map((app) => ({
        title: app.deviceName ?? 'Unknown device',
        value: app.id,
        app,
      }));

      const value = await selectAsync(chalk`Debug target {dim (Hermes only)}`, choices);
      const menuItem = choices.find((item) => item.value === value);
      if (!menuItem) {
        return Log.error(chalk`{bold Debug:} No device available for "${value}"`);
      }

      app = menuItem.app;
    }

    if (!app) {
      return Log.error(chalk`{bold Debug:} No device selected`);
    }

    try {
      await openJsInspector(metroServerOrigin, app);
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
          action: this.openReactDevToolsAsync.bind(this),
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
