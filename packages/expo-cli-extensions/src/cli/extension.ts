import chalk from 'chalk';

import { getExpoCliPluginParameters } from './parameters';
import type { ExpoCliExtensionCommandSchema, ExpoCliExtensionExecutor } from './types';

/**
 * Executes an Expo CLI extension command with the provided executor function.
 * This function retrieves the command, arguments, and connected applications,
 * then calls the executor with these parameters.
 *
 * @param executor - A function that takes a command, arguments, and connected applications,
 *                   and returns a Promise that resolves when the command execution is complete.
 */
export async function cliExtension<T extends ExpoCliExtensionCommandSchema>(
  executor: ExpoCliExtensionExecutor<T>
) {
  const { apps, args, command } = getExpoCliPluginParameters<T>(process.argv);
  try {
    const results = await executor(command, args, apps);
    if (results) {
      console.log(JSON.stringify(results, null, 2));
    }
  } catch (error: any) {
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}
