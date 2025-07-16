import chalk from 'chalk';

import { BLT, printHelp, printItem, printQRCode, printUsage, StartOptions } from './commandsTable';
import * as Log from '../../log';
import { env } from '../../utils/env';
import { learnMore, link } from '../../utils/link';
import { openBrowserAsync } from '../../utils/open';
import { ora } from '../../utils/ora';
import { ExpoChoice, promptAsync, selectAsync } from '../../utils/prompts';
import { DevServerManager } from '../server/DevServerManager';
import { DevToolsPlugin, DevToolsPluginCliCommandParameter } from '../server/DevToolsPluginManager';
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
      const plugins = await this.devServerManager.devtoolsPluginManager.queryPluginsAsync();

      // Group plugins by their packageName to avoid duplicates and merge their properties
      const pluginMap = plugins.reduce(
        (acc, plugin) => {
          if (!acc[plugin.packageName]) {
            acc[plugin.packageName] = {};
          }
          if ('webpageEndpoint' in plugin && plugin.webpageEndpoint) {
            // If the plugin has a webpage endpoint, we can open it in the browser.
            acc[plugin.packageName].devtool = plugin as DevToolsPlugin;
          }
          if ('cli' in plugin && (plugin.cli?.commands.length ?? 0) > 0 && plugin.executor) {
            // If the plugin has an executor and one or more CLI commands, we can execute it
            acc[plugin.packageName].cli = plugin;
          }
          return acc;
        },
        {} as Record<string, { cli?: DevToolsPlugin; devtool?: DevToolsPlugin }>
      );

      // Enumerate plugins and build menuitem strcuture - with a submenu for plugins that have both CLI commands and devtools.
      const pluginMenuItems: MoreToolMenuItem[] = plugins
        .map((plugin) => {
          const commands = (plugin.cli?.commands ?? []).filter(
            (p) => p.disabled?.includes('cli') !== true
          );
          if (commands.length > 0 && plugin.webpageEndpoint) {
            // We have both a devtool and CLI commands for this plugin, so we create a submenu.
            return {
              title: chalk`{bold ${plugin.packageName}}`,
              value: `plugin:${plugin.packageName}`,
              action: async () => {
                // Create on menu with the devtool and for each CLI command
                const submenuItems: MoreToolMenuItem[] = [
                  devtoolFactory(plugin, this.devServerManager),
                  ...commands.map((descriptor) => ({
                    title: descriptor.caption,
                    value: descriptor.name,
                    action: () => cliCommandExecutor(plugin, descriptor, this.devServerManager),
                  })),
                ].filter((item) => item !== null) as MoreToolMenuItem[];

                try {
                  const value = await selectAsync(chalk`{dim Select command}`, submenuItems);
                  await submenuItems.find((item) => item.value === value)?.action?.();
                } catch (error: any) {
                  // Handle aborting prompt
                  debug(`Failed to execute command: ${error.toString()}`);
                }
              },
            };
          } else if (plugin.webpageEndpoint) {
            // Only devtools
            return devtoolFactory(plugin, this.devServerManager);
          } else if (plugin.cli && commands.length > 0) {
            // Only Cli commands
            return cliFactory(plugin, this.devServerManager);
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

// Create factories for devtools and CLI commands
const devtoolFactory = (
  plugin: DevToolsPlugin,
  devServerManager: DevServerManager
): MoreToolMenuItem | null => {
  if (plugin.webpageEndpoint == null) {
    return null;
  }

  return {
    title: chalk`Open {bold ${plugin.packageName}}`,
    value: `devtoolsPlugin:${plugin.packageName}`,
    action: async () => {
      const url = new URL(
        plugin.webpageEndpoint!,
        devServerManager.getDefaultDevServer().getUrlCreator().constructUrl({ scheme: 'http' })
      );
      await openBrowserAsync(url.toString());
    },
  };
};

const cliFactory = (
  plugin: DevToolsPlugin,
  devServerManager: DevServerManager
): MoreToolMenuItem | null => {
  const cliConfig = plugin.cli;
  const commands = (cliConfig?.commands ?? []).filter((p) => p.disabled?.includes('cli') !== true);

  if (cliConfig == null || commands.length === 0) {
    return null;
  }
  return {
    title: chalk`{bold ${plugin.packageName}}`,
    value: `cliPlugin:${plugin.packageName}`,
    action: async () => {
      // Show selector with plugin commands.
      const commandMenuItems = commands.map((cmd) => ({
        title: cmd.caption,
        value: cmd.name,
      }));

      try {
        const value = await selectAsync(chalk`{dim Select command}`, commandMenuItems);
        const cmd = commands.find((c) => c.name === value);
        if (cmd == null) {
          Log.warn(`No command found for ${plugin.packageName}`);
        } else {
          await cliCommandExecutor(plugin, cmd, devServerManager);
        }
      } catch (error: any) {
        // Handle aborting prompt
        debug(`Failed to execute command: ${error.toString()}`);
      }
    },
  };
};

const cliCommandExecutor = async (
  plugin: DevToolsPlugin,
  cmd: {
    name: string;
    caption: string;
    parameters?: DevToolsPluginCliCommandParameter[];
  },
  devServerManager: DevServerManager
) => {
  const cliConfig = plugin.cli;
  if (cliConfig == null) {
    return;
  }

  if (plugin.executor == null) {
    Log.warn(chalk`{bold ${plugin.packageName}} does not support CLI commands.`);
    return;
  }

  // Get all connected apps
  const metroServerOrigin = devServerManager.getDefaultDevServer().getJsInspectorBaseUrl();
  const apps = await queryAllInspectorAppsAsync(metroServerOrigin);

  // Prompt for parameters if they are required.
  let args: Record<string, string> = {};
  if (cmd.parameters && cmd.parameters.length > 0) {
    // Prompt for parameters if they are required.
    args = await cmd.parameters.reduce(
      async (accPromise, param) => {
        const acc = await accPromise;
        const result = await promptAsync({
          name: param.name,
          hint: param.description,
          type: param.type,
          message: param.description ?? param.name,
        });
        return { ...acc, [param.name]: result[param.name] };
      },
      Promise.resolve({} as Record<string, string>)
    );
  }

  const spinner = ora(`Executing '${cmd.caption}'`).start();

  try {
    // Execute the command with the plugin executor.
    const results = await plugin.executor({
      command: cmd.name,
      apps,
      args: { ...args, source: 'cli' },
    });
    // Format the results - it can be a list of ExpoCliOutput objects - or void
    let resultsString = '\n';
    if (results) {
      // Try to parse the output from the tool
      try {
        const parsedResults = JSON.parse(results) ?? [];
        resultsString += parsedResults
          .map((result: any) => {
            switch (result.type) {
              case 'text':
                return result.url ? result.text + ': ' + link(result.url) : result.text;
              case 'audio':
                return result.url ? link(result.url, { text: 'Audio', dim: true }) : 'Audio';
              case 'image':
                return result.url ? link(result.url, { text: 'Image', dim: true }) : 'Image';
              default:
                return '';
            }
          })
          .join('\n');
      } catch (e) {
        resultsString += results;
      }
    }
    spinner.succeed(`${cmd.caption} succeeded:${resultsString}`).stop();
  } catch (error: any) {
    // @ts-ignore
    if (__DEV__) {
      spinner.stop();
      // In development mode, log the error to the console for debugging.
      console.error(chalk.red(`Error executing command '${cmd.name}':`));
      console.error(error);
    } else {
      spinner.fail(`Failed executing task.\n${error.toString().trim()}`);
    }
  }
};
