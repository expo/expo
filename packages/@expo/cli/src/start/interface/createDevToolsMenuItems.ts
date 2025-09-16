import chalk from 'chalk';

import { cliExtensionMenuItemHandler } from './cliExtensionMenuItemHandler';
import * as Log from '../../log';
import { openBrowserAsync } from '../../utils/open';
import { ExpoChoice, selectAsync } from '../../utils/prompts';
import { DevToolsPlugin } from '../server/DevToolsPlugin';
import { DevToolsPluginCommand } from '../server/DevToolsPlugin.schema';

const debug = require('debug')('expo:start:interface:interactiveActions') as typeof console.log;

export interface MoreToolMenuItem extends ExpoChoice<string> {
  action?: () => unknown;
}

type MenuItemWithSubmenu = MoreToolMenuItem & {
  children?: MenuItemWithSubmenu[];
};

type CliExtensionMenuItemHandler = (
  plugin: DevToolsPlugin,
  cmd: DevToolsPluginCommand,
  metroServerOrigin: string
) => Promise<void>;

/**
 * Creates the menu items for the DevTools interface.
 * @param plugins The list of DevTools plugins.
 * @param defaultServerUrl The default server URL.
 * @param metroServerOrigin The Metro server origin.
 * @param cliExtensionMenuItemHandlerFunc The function to handle CLI extension menu items.
 * @param openBrowserAsyncFunc The function to open the browser.
 * @returns The menu items for the DevTools interface.
 */
export const createDevToolsMenuItems = (
  plugins: DevToolsPlugin[],
  defaultServerUrl: string,
  metroServerOrigin: string,
  cliExtensionMenuItemHandlerFunc: CliExtensionMenuItemHandler = cliExtensionMenuItemHandler, // Used for injection when testing
  openBrowserAsyncFunc: typeof openBrowserAsync = openBrowserAsync // Used for injection when testing
): MenuItemWithSubmenu[] => {
  return plugins
    .map((plugin) => {
      const commands = getCliExtensionCommands(plugin);
      if (commands.length > 0 && plugin.webpageEndpoint) {
        // Custom display/handling for plugins that support both web and CLI commands
        const children = [
          devtoolFactory(plugin, defaultServerUrl, openBrowserAsyncFunc),
          ...commands.map((descriptor) => ({
            title: descriptor.title,
            value: descriptor.name,
            action: async () =>
              await cliExtensionMenuItemHandlerFunc(plugin, descriptor, metroServerOrigin),
          })),
        ].filter((item) => item != null);
        return {
          title: chalk`{bold ${plugin.packageName}}`,
          value: '',
          children,
          action: async () => {
            try {
              const value = await selectAsync(chalk`{dim Select command}`, children);
              await children.find((item) => item.value === value)?.action?.();
            } catch (error: any) {
              // Handle aborting prompt
              debug(`Failed to execute command: ${error.toString()}`);
            }
          },
        };
      } else if (plugin.webpageEndpoint) {
        return devtoolFactory(plugin, defaultServerUrl);
      } else if (plugin.cliExtensions && commands.length > 0) {
        return cliExtensionFactory(plugin, metroServerOrigin);
      }
      return null;
    })
    .filter((menuItem) => menuItem != null);
};

const devtoolFactory = (
  plugin: DevToolsPlugin,
  defaultServerUrl: string,
  openBrowserAsyncFunc: typeof openBrowserAsync = openBrowserAsync // Used for injection when testing
): MoreToolMenuItem | null => {
  if (plugin.webpageEndpoint == null) {
    return null;
  }

  return {
    title: chalk`Open {bold ${plugin.packageName}}`,
    value: `devtoolsPlugin:${plugin.packageName}`,
    action: async () => {
      const url = new URL(plugin.webpageEndpoint!, defaultServerUrl);
      await openBrowserAsyncFunc(url.toString());
    },
  };
};

const getCliExtensionCommands = (plugin: DevToolsPlugin): DevToolsPluginCommand[] => {
  const cliExtensionsConfig = plugin.cliExtensions;
  const commands = (cliExtensionsConfig?.commands ?? []).filter((p) =>
    p.environments?.includes('cli')
  );

  if (cliExtensionsConfig == null || commands.length === 0) {
    return [];
  }
  return commands;
};

const cliExtensionFactory = (
  plugin: DevToolsPlugin,
  metroServerOrigin: string,
  cliExtensionMenuItemHandlerFunc: CliExtensionMenuItemHandler = cliExtensionMenuItemHandler // Used for injection when testing
): MenuItemWithSubmenu | null => {
  const commands = getCliExtensionCommands(plugin);
  const children = commands.map((cmd) => ({
    title: cmd.title,
    value: cmd.name,
  }));

  return {
    title: chalk`{bold ${plugin.packageName}}`,
    value: `cliExtension:${plugin.packageName}`,
    children,
    action: async () => {
      try {
        const value = await selectAsync(chalk`{dim Select command}`, children);
        const cmd = commands.find((c) => c.name === value);
        if (cmd == null) {
          Log.warn(`No command found for ${plugin.packageName}`);
        } else {
          await cliExtensionMenuItemHandlerFunc(plugin, cmd, metroServerOrigin);
        }
      } catch (error: any) {
        // Handle aborting prompt
        debug(`Failed to execute command: ${error.toString()}`);
      }
    },
  };
};
