// @ts-nocheck
import chalk from 'chalk';

import type {
  ExpoCliExtensionAppInfo,
  ExpoCliExtensionCommandSchema,
  ExpoCliExtensionExecutor,
  ExpoCliExtensionParameters,
} from './CliExtension.types';

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
  const { metroServerOrigin, args, command } = getExpoCliPluginParameters<T>(process.argv);
  try {
    const results = await executor(command, args, metroServerOrigin);
    if (results) {
      console.log(JSON.stringify(results, null, 2));
    }
  } catch (error: any) {
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

/**
 * Returns typed parameters for an Expo CLI plugin.
 * Parameters are read from the process.
 */
export const getExpoCliPluginParameters = <T extends ExpoCliExtensionCommandSchema>(
  argv: string[]
): ExpoCliExtensionParameters<T> => {
  // Extract command, args, and apps from process arguments
  const command = argv[2]?.toLowerCase();
  const metroServerOrigin = argv[3] ?? '';
  const argsString = argv[4] ?? '{}';

  // Verify command exists
  if (!command) {
    throw new Error('No command provided.');
  }

  let args: T['args'] = {} as T['args'];

  if (!metroServerOrigin || typeof metroServerOrigin !== 'string') {
    throw new Error('Invalid metroServerOrigin parameter. It must be a non-empty string.');
  }

  try {
    args = JSON.parse(argsString);
  } catch (error) {
    throw new Error(
      `Invalid args JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  if (Array.isArray(args) || typeof args !== 'object') {
    throw new Error('Expected object for args parameter, got ' + JSON.stringify(args));
  }

  return {
    command,
    args,
    metroServerOrigin,
  };
};
