/**
 * RSC Serializer Plugin
 *
 * Resolves deferred stable IDs for React Server Components.
 * Deferred IDs are marked by Babel with __RSC_DEFERRED__:/path/to/file.js
 * and resolved here using the captured specifier registry.
 */

import type { MixedOutput, Module, ReadOnlyGraph } from '@expo/metro/metro/DeltaBundler/types';

import { clearRegistry, getStableId } from '../rscRegistry';
import type { SerializerParameters } from './withExpoSerializers';

// Must match the prefix in babel-preset-expo/src/client-module-proxy-plugin.ts
const RSC_DEFERRED_PREFIX = '__RSC_DEFERRED__:';

function isDeferredId(id: string): boolean {
  return id.startsWith(RSC_DEFERRED_PREFIX);
}

function extractPath(deferredId: string): string {
  return deferredId.slice(RSC_DEFERRED_PREFIX.length);
}

export interface RscSerializerPluginOptions {
  projectRoot: string;
  debug?: boolean;
}

/**
 * Serializer plugin that resolves deferred RSC stable IDs.
 */
export function createRscSerializerPlugin(options: RscSerializerPluginOptions) {
  const { projectRoot, debug = false } = options;

  return async function rscSerializerPlugin(
    ...props: SerializerParameters
  ): Promise<SerializerParameters> {
    const [entryPoint, preModules, graph, serializerOptions] = props;

    // Maps stable ID → module ID (for runtime require())
    const stableIdToModuleId = new Map<string, string | number>();
    // Maps stable ID → file path (for chunk lookup in SSR manifest)
    const stableIdToFilePath = new Map<string, string>();
    let resolvedCount = 0;

    // Process all modules
    for (const [modulePath, module] of graph.dependencies) {
      for (const output of module.output) {
        const data = output.data as {
          reactClientReference?: string;
          reactServerReference?: string;
        };

        // Resolve deferred client references
        if (data.reactClientReference && isDeferredId(data.reactClientReference)) {
          const resolvedPath = extractPath(data.reactClientReference);
          const { stableId, source } = getStableId(resolvedPath, projectRoot);

          data.reactClientReference = stableId;
          stableIdToModuleId.set(stableId, serializerOptions.createModuleId(modulePath));
          stableIdToFilePath.set(stableId, modulePath);
          resolvedCount++;

          if (debug) {
            console.log(`[RSC] Resolved client: ${stableId} -> ${modulePath} (${source})`);
          }
        }

        // Resolve deferred server references
        if (data.reactServerReference && isDeferredId(data.reactServerReference)) {
          const resolvedPath = extractPath(data.reactServerReference);
          const { stableId, source } = getStableId(resolvedPath, projectRoot);

          data.reactServerReference = stableId;
          stableIdToModuleId.set(stableId, serializerOptions.createModuleId(modulePath));
          stableIdToFilePath.set(stableId, modulePath);
          resolvedCount++;

          if (debug) {
            console.log(`[RSC] Resolved server: ${stableId} -> ${modulePath} (${source})`);
          }
        }

        // Also capture non-deferred IDs (app-level files)
        if (data.reactClientReference && !isDeferredId(data.reactClientReference)) {
          stableIdToModuleId.set(
            data.reactClientReference,
            serializerOptions.createModuleId(modulePath)
          );
          stableIdToFilePath.set(data.reactClientReference, modulePath);
        }
        if (data.reactServerReference && !isDeferredId(data.reactServerReference)) {
          stableIdToModuleId.set(
            data.reactServerReference,
            serializerOptions.createModuleId(modulePath)
          );
          stableIdToFilePath.set(data.reactServerReference, modulePath);
        }
      }
    }

    // Store mappings for SSR manifest
    if (!graph.transformOptions) {
      (graph as any).transformOptions = {};
    }
    if (!graph.transformOptions.customTransformOptions) {
      (graph.transformOptions as any).customTransformOptions = {};
    }
    (graph.transformOptions.customTransformOptions as any).__rscStableIdToModuleId =
      Object.fromEntries(stableIdToModuleId);
    (graph.transformOptions.customTransformOptions as any).__rscStableIdToFilePath =
      Object.fromEntries(stableIdToFilePath);

    if (debug && resolvedCount > 0) {
      console.log(`[RSC] Resolved ${resolvedCount} deferred stable IDs`);
    }

    // Clear registry after serialization to prevent stale entries in watch mode
    clearRegistry();

    return [entryPoint, preModules, graph, serializerOptions];
  };
}

/**
 * Get RSC stable ID → module ID mapping from graph.
 */
export function getRscStableIdToModuleId(
  graph: ReadOnlyGraph<MixedOutput>
): Record<string, string | number> {
  return (graph.transformOptions?.customTransformOptions as any)?.__rscStableIdToModuleId ?? {};
}

/**
 * Get RSC stable ID → file path mapping from graph.
 * Used for SSR manifest chunk lookup.
 */
export function getRscStableIdToFilePath(
  graph: ReadOnlyGraph<MixedOutput>
): Record<string, string> {
  return (graph.transformOptions?.customTransformOptions as any)?.__rscStableIdToFilePath ?? {};
}
