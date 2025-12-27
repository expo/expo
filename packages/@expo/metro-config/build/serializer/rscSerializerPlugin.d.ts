/**
 * RSC Serializer Plugin
 *
 * Collects RSC client/server boundary metadata and builds module maps.
 *
 * This plugin does:
 * 1. Collects reactClientReference/reactServerReference from module metadata
 * 2. Builds stable ID → module ID mapping for runtime require()
 * 3. Replaces __RSC_BOUNDARIES_PLACEHOLDER__ in virtual rsc.js module
 */
import type { MixedOutput, ReadOnlyGraph } from '@expo/metro/metro/DeltaBundler/types';
import type { SerializerParameters } from './withExpoSerializers';
export interface RscSerializerPluginOptions {
    projectRoot: string;
    debug?: boolean;
}
/**
 * Serializer plugin that collects RSC metadata and builds module maps.
 */
export declare function createRscSerializerPlugin(options: RscSerializerPluginOptions): (...props: SerializerParameters) => Promise<SerializerParameters>;
/**
 * Get RSC stable ID → module ID mapping from graph.
 */
export declare function getRscStableIdToModuleId(graph: ReadOnlyGraph<MixedOutput>): Record<string, string | number>;
/**
 * Get RSC stable ID → file path mapping from graph.
 */
export declare function getRscStableIdToFilePath(graph: ReadOnlyGraph<MixedOutput>): Record<string, string>;
