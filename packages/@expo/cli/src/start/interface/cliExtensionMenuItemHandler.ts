import chalk from 'chalk';

import * as Log from '../../log';
import { link } from '../../utils/link';
import { ora } from '../../utils/ora';
import { promptAsync } from '../../utils/prompts';
import { DevToolsPlugin } from '../server/DevToolsPlugin';
import { DevToolsPluginCommand } from '../server/DevToolsPlugin.schema';

/**
 * Handles the CLI extension menu item selection and execution of the plugin command for use
 * in the cli context, logging to the terminal.
 *
 * The function will prompt for any required parameters, confirm execution, and display
 * output from the command execution.
 *
 * @param plugin The DevTools plugin.
 * @param command The command to execute.
 * @param metroServerOrigin The Metro server origin.
 * @returns
 */
export const cliExtensionMenuItemHandler = async (
  plugin: DevToolsPlugin,
  command: DevToolsPluginCommand,
  metroServerOrigin: string
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
  if (command.parameters && command.parameters.length > 0) {
    args = await command.parameters.reduce(
      async (accPromise, param) => {
        const acc = await accPromise;
        const result = await promptAsync({
          name: param.name,
          type: param.type,
          message:
            `${param.name}${param.description ? chalk` {dim ${param.description}}` : ''}` +
            chalk` {dim (${param.type})}`,
        });
        if (result[param.name] == null) {
          throw new Error('Input cancelled');
        }
        return { ...acc, [param.name]: result[param.name] };
      },
      Promise.resolve({} as Record<string, string>)
    );
  }

  // Confirm execution
  const { value } = await promptAsync({
    message: chalk`{dim Execute command "${command.title}":} "${plugin.executor.getCommandString({ command: command.name, args })}"`,
    initial: false,
    name: 'value',
    type: 'confirm',
  });

  if (value == null) {
    return;
  }

  const spinnerText = `Executing command '${command.title}'`;
  const spinner = ora(spinnerText).start();

  try {
    const t = (text: string, level: 'info' | 'warning' | 'error') =>
      level === 'error'
        ? chalk.red(text.trim())
        : level === 'warning'
          ? chalk.yellow(text.trim())
          : text.trim();

    const o = (text: string) => (spinner.text += '\n  ' + text);

    // Execute and stream the output
    const results = await plugin.executor.execute({
      command: command.name,
      metroServerOrigin,
      args,
      onOutput: (output) => {
        output.forEach((line) => {
          switch (line.type) {
            case 'text':
              o(
                line.url
                  ? link(line.url, { text: t(line.text, line.level), dim: false })
                  : t(line.text, line.level)
              );
              break;
            case 'audio':
              o(link(line.url, { text: line.text ?? 'Audio', dim: false }));
              break;
            case 'image':
              o(link(line.url, { text: line.text ?? 'Image', dim: false }));
              break;
          }
        });
      },
    });

    // Format with warning or success depending on wether the client reported any errors
    const output = spinner.text.split('\n').slice(1).join('\n');
    if (results.find((line) => line.type === 'text' && line.level === 'error')) {
      spinner.fail(`Command "${command.title}" completed with errors.\n${output}`);
    } else if (results.find((line) => line.type === 'text' && line.level === 'warning')) {
      spinner.warn(`Command "${command.title}" completed with warnings.\n${output}`);
    } else {
      spinner.succeed(`Command "${command.title}" completed successfully.\n${output}`).stop();
    }
  } catch (error: any) {
    spinner.fail(`Failed to execute command "${command.title}".\n${error.toString().trim()}`);
  }
};
