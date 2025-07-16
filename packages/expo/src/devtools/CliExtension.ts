import chalk from 'chalk';

import type {
  ExpoCliExtensionAppInfo,
  ExpoCliExtensionCommandSchema,
  ExpoCliExtensionExecutor,
  ExpoCliExtensionParameters,
} from './cliextension.types';

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

/**
 * Returns typed parameters for an Expo CLI plugin.
 * Parameters are read from the process.
 */
export const getExpoCliPluginParameters = <T extends ExpoCliExtensionCommandSchema>(
  argv: string[]
): ExpoCliExtensionParameters<T> => {
  // Extract command, args, and apps from process arguments
  const command = argv[2]?.toLowerCase();
  const argsString = argv[3] ?? '{}';
  const appsString = argv[4] ?? '[]';

  // Verify command exists
  if (!command) {
    throw new Error('No command provided.');
  }

  let args: any;
  let apps: ExpoCliExtensionAppInfo[];

  try {
    args = JSON.parse(argsString);
  } catch (error) {
    throw new Error(
      `Invalid args JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  try {
    apps = JSON.parse(appsString);
  } catch (error) {
    throw new Error(
      `Invalid apps JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  if (!Array.isArray(apps)) {
    throw new Error('Apps parameter must be an array.');
  }

  return {
    command,
    args,
    apps,
  } as ExpoCliExtensionParameters<T>;
};
