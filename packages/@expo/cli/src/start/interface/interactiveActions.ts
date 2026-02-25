import chalk from 'chalk';

import { BLT, printHelp, printItem, printUsage, StartOptions } from './commandsTable';
import { createDevToolsMenuItems } from './createDevToolsMenuItems';
import * as Log from '../../log';
import { env } from '../../utils/env';
import { learnMore } from '../../utils/link';
import { ExpoChoice, selectAsync } from '../../utils/prompts';
import { printQRCode } from '../../utils/qr';
import { DevServerManager } from '../server/DevServerManager';
import {
  openJsInspector,
  queryAllInspectorAppsAsync,
  promptInspectorAppAsync,
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
    // Keep track of approximately how much space we have to print our usage guide
    let rows = process.stdout.rows || Infinity;

    // If native dev server is running, print its URL.
    if (this.devServerManager.getNativeDevServerPort()) {
      const devServer = this.devServerManager.getDefaultDevServer();
      try {
        const nativeRuntimeUrl = devServer.getNativeRuntimeUrl()!;
        const interstitialPageUrl = devServer.getRedirectUrl();

        // Print the URL to stdout for tests
        if (env.__EXPO_E2E_TEST) {
          console.info(
            `[__EXPO_E2E_TEST:server] ${JSON.stringify({ url: devServer.getDevServerUrl() })}`
          );
          rows--;
        }

        if (!env.EXPO_NO_QR_CODE) {
          const qr = printQRCode(interstitialPageUrl ?? nativeRuntimeUrl);
          rows -= qr.lines;
          qr.print();

          let qrMessage = '';
          if (!options.devClient) {
            qrMessage = `Scan the QR code above to open in ${chalk`{bold Expo Go}`}.`;
          } else {
            qrMessage = chalk`Scan the QR code above to open in a {bold development build}.`;
            qrMessage += ` (${learnMore('https://expo.fyi/start')})`;
          }
          rows--;
          Log.log(printItem(qrMessage, { dim: true }));
        }

        if (interstitialPageUrl) {
          rows--;
          Log.log(
            printItem(
              chalk`Choose an app to open your project at {underline ${interstitialPageUrl}}`
            )
          );
        }

        rows--;
        Log.log(printItem(chalk`Metro: {underline ${nativeRuntimeUrl}}`));
      } catch (error) {
        console.log('err', error);
        // @ts-ignore: If there is no development build scheme, then skip the QR code.
        if (error.code !== 'NO_DEV_CLIENT_SCHEME') {
          throw error;
        } else {
          const serverUrl = devServer.getDevServerUrl();
          Log.log(printItem(chalk`Metro: {underline ${serverUrl}}`));
          Log.log(printItem(`Linking is disabled because the client scheme cannot be resolved.`));
          rows -= 2;
        }
      }
    }

    if (this.options.platforms?.includes('web')) {
      const webDevServer = this.devServerManager.getWebDevServer();
      const webUrl = webDevServer?.getDevServerUrl({ hostType: 'localhost' });
      if (webUrl) {
        Log.log(printItem(chalk`Web: {underline ${webUrl}}`));
        rows--;
      }
    }

    printUsage(options, { verbose: false, rows });
    printHelp();
    Log.log();
  }

  async openJsInspectorAsync() {
    try {
      const metroServerOrigin = this.devServerManager.getDefaultDevServer().getJsInspectorBaseUrl();
      const apps = await queryAllInspectorAppsAsync(metroServerOrigin);
      if (!apps.length) {
        return Log.warn(
          chalk`{bold Debug:} No compatible apps connected, React Native DevTools can only be used with Hermes. ${learnMore(
            'https://docs.expo.dev/guides/using-hermes/'
          )}`
        );
      }

      const app = await promptInspectorAppAsync(apps);
      if (!app) {
        return Log.error(chalk`{bold Debug:} No inspectable device selected`);
      }

      if (!(await openJsInspector(metroServerOrigin, app))) {
        Log.warn(
          chalk`{bold Debug:} Failed to open the React Native DevTools, see debug logs for more info.`
        );
      }
    } catch (error: any) {
      // Handle aborting prompt
      if (error.code === 'ABORTED') return;

      Log.error('Failed to open the React Native DevTools.');
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
        // TODO: Maybe a "View Source" option to open code.
      ];

      const defaultServerUrl = this.devServerManager
        .getDefaultDevServer()
        .getUrlCreator()
        .constructUrl({ scheme: 'http' });

      const metroServerOrigin = this.devServerManager.getDefaultDevServer().getJsInspectorBaseUrl();
      const plugins = await this.devServerManager.devtoolsPluginManager.queryPluginsAsync();

      const menuItems = [
        ...defaultMenuItems,
        ...createDevToolsMenuItems(plugins, defaultServerUrl, metroServerOrigin),
      ];

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

  toggleDevMenu() {
    Log.log(`${BLT} Toggling dev menu`);
    this.devServerManager.broadcastMessage('devMenu');
  }
}
