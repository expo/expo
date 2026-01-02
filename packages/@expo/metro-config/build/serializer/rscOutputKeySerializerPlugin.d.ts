import type { MixedOutput, Module, ReadOnlyGraph } from '@expo/metro/metro/DeltaBundler';
import type { ExpoSerializerOptions } from './fork/baseJSBundle';
type SerializerParameters = [
    string,
    readonly Module<MixedOutput>[],
    ReadOnlyGraph,
    ExpoSerializerOptions
];
/**
 * Serializer plugin that replaces file:// URL placeholders with stable output keys.
 *
 * This plugin runs after reconcileTransformSerializerPlugin and replaces file:// URLs
 * (inserted by babel plugins) with stable output keys.
 *
 * Why this approach?
 * 1. Babel runs in worker processes without access to the dependency graph
 * 2. The serializer runs in the main process and can normalize paths
 *
 * The output key format:
 * - node_modules files: path after last /node_modules/ (handles pnpm)
 * - app files: ./ + relative path from project root
 *
 * This must match the SSR manifest generation in MetroBundlerDevServer.ts.
 */
export declare function rscOutputKeySerializerPlugin(entryPoint: string, preModules: readonly Module<MixedOutput>[], graph: ReadOnlyGraph, options: ExpoSerializerOptions): Promise<SerializerParameters>;
export {};
