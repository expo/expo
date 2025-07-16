import chalk from 'chalk';

import * as Log from '../../log';
import { link } from '../../utils/link';
import { openBrowserAsync } from '../../utils/open';
import { ora } from '../../utils/ora';
import { ExpoChoice, promptAsync, selectAsync } from '../../utils/prompts';
import {
  DevToolsPlugin,
  DevToolsPluginCliCommand,
  DevToolsPluginCliCommandParameter,
} from '../server/DevToolsPlugin';
import { MetroInspectorProxyApp } from '../server/middleware/inspector/JsInspector';

const debug = require('debug')('expo:start:interface:interactiveActions') as typeof console.log;

export interface MoreToolMenuItem extends ExpoChoice<string> {
  action?: () => unknown;
}

type MenuItemWithSubmenu = MoreToolMenuItem & {
  children?: MenuItemWithSubmenu[];
};

type InteractiveMenuItemExecutor = (
  plugin: DevToolsPlugin,
  cmd: DevToolsPluginCliCommand,
  apps: MetroInspectorProxyApp[]
) => Promise<void>;

export const createDevToolsMenuItems = (
  plugins: DevToolsPlugin[],
  defaultServerUrl: string,
  getInspectorApps: () => Promise<MetroInspectorProxyApp[]>,
  cliExtensionExecutor: InteractiveMenuItemExecutor = defaultCliExtensionExecutor
): MenuItemWithSubmenu[] => {
  return plugins
    .map((plugin) => {
      const commands = (plugin.cliExtensions?.commands ?? []).filter((p) =>
        p.environments?.includes('cli')
      );
      if (commands.length > 0 && plugin.webpageEndpoint) {
        const children = [
          {
            title: chalk`Open {bold ${plugin.packageName}}`,
            value: `devtoolsPlugin:${plugin.packageName}`,
            action: async () => {
              const url = new URL(plugin.webpageEndpoint!, plugin.projectRoot);
              await openBrowserAsync(url.toString());
            },
          },
          ...commands.map((descriptor) => ({
            title: descriptor.title,
            value: descriptor.name,
            action: async () =>
              await cliExtensionExecutor(plugin, descriptor, await getInspectorApps()),
          })),
        ];
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
        return cliFactory(plugin, getInspectorApps);
      }
      return null;
    })
    .filter((menuItem) => menuItem != null);
};

const devtoolFactory = (
  plugin: DevToolsPlugin,
  defaultServerUrl: string
): MoreToolMenuItem | null => {
  if (plugin.webpageEndpoint == null) {
    return null;
  }

  return {
    title: chalk`Open {bold ${plugin.packageName}}`,
    value: `devtoolsPlugin:${plugin.packageName}`,
    action: async () => {
      const url = new URL(plugin.webpageEndpoint!, defaultServerUrl);
      await openBrowserAsync(url.toString());
    },
  };
};

const cliFactory = (
  plugin: DevToolsPlugin,
  getInspectorApps: () => Promise<MetroInspectorProxyApp[]>
): MenuItemWithSubmenu | null => {
  const cliExtensionsConfig = plugin.cliExtensions;
  const commands = (cliExtensionsConfig?.commands ?? []).filter((p) =>
    p.environments?.includes('cli')
  );

  if (cliExtensionsConfig == null || commands.length === 0) {
    return null;
  }

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
          await defaultCliExtensionExecutor(plugin, cmd, await getInspectorApps());
        }
      } catch (error: any) {
        // Handle aborting prompt
        debug(`Failed to execute command: ${error.toString()}`);
      }
    },
  };
};

const defaultCliExtensionExecutor: InteractiveMenuItemExecutor = async (
  plugin: DevToolsPlugin,
  cmd: {
    name: string;
    title: string;
    parameters?: DevToolsPluginCliCommandParameter[];
  },
  apps: MetroInspectorProxyApp[]
) => {
  const cliExtensionsConfig = plugin.cliExtensions;
  if (cliExtensionsConfig == null) {
    return;
  }

  if (plugin.executor == null) {
    Log.warn(chalk`{bold ${plugin.packageName}} does not support CLI commands.`);
    return;
  }

  let args: Record<string, string> = {};
  if (cmd.parameters && cmd.parameters.length > 0) {
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

  const spinner = ora(`Executing '${cmd.title}'`).start();

  try {
    const results = await plugin.executor({
      command: cmd.name,
      apps,
      args: { ...args, source: 'cli' },
    });
    let resultsString = '\n';
    if (results) {
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
    spinner.succeed(`${cmd.title} succeeded:${resultsString}`).stop();
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
