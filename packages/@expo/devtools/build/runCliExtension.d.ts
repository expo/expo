import type { ExpoCliExtensionCommandSchema, ExpoCliExtensionExecutor, ExpoCliExtensionParameters } from './CliExtension.types.js';
/**
 * Executes an Expo CLI extension command with the provided executor function.
 * This function retrieves the command, arguments, and connected applications,
 * then calls the executor with these parameters.
 *
 * @param executor - A function that takes a command, arguments, and connected applications,
 *                   and returns a Promise that resolves when the command execution is complete.
 */
export declare function runCliExtension<T extends ExpoCliExtensionCommandSchema>(executor: ExpoCliExtensionExecutor<T>): Promise<void>;
/**
 * Returns typed parameters for an Expo CLI plugin. (exported for testing)
 * Parameters are read from the process.
 */
declare const getExpoCliPluginParameters: <T extends ExpoCliExtensionCommandSchema>(argv: string[]) => ExpoCliExtensionParameters<T>;
export { getExpoCliPluginParameters as testing_getExpoCliPluginParameters };
//# sourceMappingURL=runCliExtension.d.ts.map