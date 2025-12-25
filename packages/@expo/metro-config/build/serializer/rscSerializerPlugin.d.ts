/**
 * RSC Serializer Plugin
 *
 * Resolves deferred stable IDs for React Server Components.
 * Deferred IDs are marked by Babel with __RSC_DEFERRED__:/path/to/file.js
 * and resolved here using the captured specifier registry.
 */
import type { MixedOutput, ReadOnlyGraph } from '@expo/metro/metro/DeltaBundler/types';
import type { SerializerParameters } from './withExpoSerializers';
export interface RscSerializerPluginOptions {
    projectRoot: string;
    debug?: boolean;
}
/**
 * Serializer plugin that resolves deferred RSC stable IDs.
 */
export declare function createRscSerializerPlugin(options: RscSerializerPluginOptions): (...props: SerializerParameters) => Promise<SerializerParameters>;
/**
 * Get RSC stable ID mapping from graph (for SSR manifest).
 */
export declare function getRscStableIdToModuleId(graph: ReadOnlyGraph<MixedOutput>): Record<string, string | number>;
