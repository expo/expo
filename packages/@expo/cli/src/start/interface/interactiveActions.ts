import chalk from 'chalk';

import { BLT, printHelp, printItem, printQRCode, printUsage, StartOptions } from './commandsTable';
import * as Log from '../../log';
import { env } from '../../utils/env';
import { learnMore } from '../../utils/link';
import { openBrowserAsync } from '../../utils/open';
import { ora } from '../../utils/ora';
import { ExpoChoice, selectAsync } from '../../utils/prompts';
import { CliCommand, CliCommandPlugin } from '../server/CliCommandsManager';
import { DevServerManager } from '../server/DevServerManager';
import { DevToolsPlugin } from '../server/DevToolsPluginManager';
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

        if (env.__EXPO_E2E_TEST) {
          // Print the URL to stdout for tests
          console.info(
            `[__EXPO_E2E_TEST:server] ${JSON.stringify({ url: devServer.getDevServerUrl() })}`
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
      // Group plugins by their packageName to avoid duplicates and merge their properties
      const pluginMap = [
        ...(await this.devServerManager.devtoolsPluginManager.queryPluginsAsync()),
        ...(await this.devServerManager.cliCommandsManager.queryPluginsAsync()).filter(
          (plugin) => plugin.cliEnabled !== false
        ),
      ].reduce(
        (acc, plugin) => {
          if (!acc[plugin.packageName]) {
            acc[plugin.packageName] = {};
          }
          if ('webpageEndpoint' in plugin && plugin.webpageEndpoint) {
            // If the plugin has a webpage endpoint, we can open it in the browser.
            acc[plugin.packageName].devtool = plugin as DevToolsPlugin;
          }
          if ('commands' in plugin && plugin.commands.length > 0) {
            // If the plugin has CLI commands, we can execute them.
            acc[plugin.packageName].cli = plugin as CliCommandPlugin;
          }
          return acc;
        },
        {} as Record<string, { cli?: CliCommandPlugin; devtool?: DevToolsPlugin }>
      );

      // Create factories for devtools and CLI commands
      const devtoolFactory = (plugin: DevToolsPlugin): MoreToolMenuItem => ({
        title: chalk`Open {bold ${plugin.packageName}}`,
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
      });

      const executeCliCommand = async (plugin: CliCommandPlugin, cmd: CliCommand) => {
        // Verify that we have apps connected to the dev server.
        const metroServerOrigin = this.devServerManager
          .getDefaultDevServer()
          .getJsInspectorBaseUrl();

        const apps = await queryAllInspectorAppsAsync(metroServerOrigin);
        if (!apps.length) {
          return Log.warn(
            chalk`{bold Debug:} No compatible apps connected, React Native DevTools can only be used with Hermes. ${learnMore(
              'https://docs.expo.dev/guides/using-hermes/'
            )}`
          );
        }

        const spinner = ora(
          `Executing '${cmd.caption}'${apps.length > 0 ? ` (${apps.length} app(s))` : ''}`
        ).start();
        try {
          // Execute the command with the plugin executor.
          const results = await plugin.executor(value, apps);
          spinner.succeed(`${cmd.caption} succeeded:`).stop();
          Log.log(results.trim());
        } catch (error: any) {
          spinner.fail(`Failed executing task. ${error.toString()}`);
        }
      };

      const cliFactory = (plugin: CliCommandPlugin): MoreToolMenuItem => ({
        title: chalk`{bold ${plugin.packageName}}`,
        value: `cliPlugin:${plugin.packageName}`,
        action: async () => {
          // Show selector with plugin commands.
          const commands = plugin.commands.map((cmd) => ({
            title: cmd.caption,
            value: cmd.cmd,
          }));

          const value = await selectAsync(chalk`{dim Select command}`, commands);
          const cmd = plugin.commands.find((c) => c.cmd === value);
          if (!cmd) {
            Log.warn(`No command found for ${plugin.packageName}`);
          } else {
            await executeCliCommand(plugin, cmd);
          }
        },
      });

      // Enumerate plugins and build menuitem strcuture - with a submenu for plugins that have both CLI commands and devtools.
      const pluginMenuItems: MoreToolMenuItem[] = Object.keys(pluginMap)
        .map((key) => {
          const pluginItem = pluginMap[key];
          if (pluginItem.cli && pluginItem.devtool) {
            // We have both a devtool and CLI commands for this plugin, so we create a submenu.
            return {
              title: chalk`{bold ${pluginItem.cli.packageName}}`,
              value: `plugin:${pluginItem.cli.packageName}`,
              action: async () => {
                // Create on menu with the devtool and for each CLI command
                const submenuItems: MoreToolMenuItem[] = [
                  devtoolFactory(pluginItem.devtool!),
                  ...pluginItem.cli!.commands.map((cmd) => ({
                    title: cmd.caption,
                    value: cmd.cmd,
                    action: () => {
                      executeCliCommand(pluginItem.cli!, cmd);
                    },
                  })),
                ];
                const value = await selectAsync(chalk`{dim Select command}`, submenuItems);
                await submenuItems.find((item) => item.value === value)?.action?.();
              },
            };
          } else if (pluginItem.devtool) {
            return devtoolFactory(pluginItem.devtool);
          } else if (pluginItem.cli) {
            return cliFactory(pluginItem.cli);
          }
          return null;
        })
        .filter((menuItem) => menuItem !== undefined) as MoreToolMenuItem[];

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
  toggleDevMenu() {
    Log.log(`${BLT} Toggling dev menu`);
    this.devServerManager.broadcastMessage('devMenu');
  }
}
