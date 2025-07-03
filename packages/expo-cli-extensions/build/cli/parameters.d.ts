import { ExpoCliExtensionCommandSchema, ExpoCliExtensionParameters } from './types';
/**
 * Returns typed parameters for an Expo CLI plugin.
 * Parameters are read from the process.
 */
export declare const getExpoCliPluginParameters: <T extends ExpoCliExtensionCommandSchema>(argv: string[]) => ExpoCliExtensionParameters<T>;
