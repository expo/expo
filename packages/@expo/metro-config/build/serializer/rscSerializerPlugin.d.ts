/**
 * RSC Serializer Plugin
 *
 * Collects RSC client/server boundary metadata and builds module maps.
 *
 * This plugin does:
 * 1. Collects reactClientReference/reactServerReference from module metadata
 * 2. Builds output key → module ID mapping for runtime require()
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
 * Get RSC output key → module ID mapping from graph.
 */
export declare function getRscOutputKeyToModuleId(graph: ReadOnlyGraph<MixedOutput>): Record<string, string | number>;
/**
 * Get RSC output key → file path mapping from graph.
 */
export declare function getRscOutputKeyToFilePath(graph: ReadOnlyGraph<MixedOutput>): Record<string, string>;
