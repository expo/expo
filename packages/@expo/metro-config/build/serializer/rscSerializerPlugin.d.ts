/**
 * RSC Serializer Plugin
 *
 * Resolves deferred stable IDs for React Server Components.
 * Deferred IDs are marked by Babel with __RSC_DEFERRED__:/path/to/file.js
 * and resolved here using the captured specifier registry.
 *
 * This plugin does TWO things:
 * 1. Updates metadata (reactClientReference/reactServerReference)
 * 2. Rewrites the actual JS code to replace deferred IDs with stable IDs
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
 * Get RSC stable ID → module ID mapping from graph.
 */
export declare function getRscStableIdToModuleId(graph: ReadOnlyGraph<MixedOutput>): Record<string, string | number>;
/**
 * Get RSC stable ID → file path mapping from graph.
 * Used for SSR manifest chunk lookup.
 */
export declare function getRscStableIdToFilePath(graph: ReadOnlyGraph<MixedOutput>): Record<string, string>;
