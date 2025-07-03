import {
  ExpoCliApplication,
  ExpoCliExtensionCommandSchema,
  ExpoCliExtensionParameters,
} from './types';

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
  let apps: ExpoCliApplication[];

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
