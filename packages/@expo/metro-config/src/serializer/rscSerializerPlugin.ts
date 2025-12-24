/**
 * RSC Serializer Plugin
 *
 * Resolves deferred stable IDs for React Server Components.
 * Deferred IDs are marked by Babel with __RSC_DEFERRED__:/path/to/file.js
 * and resolved here using the captured specifier registry.
 */

import path from 'path';

import type { MixedOutput, Module, ReadOnlyGraph } from '@expo/metro/metro/DeltaBundler/types';

import { getStableId, isNodeModulePath } from '../rscRegistry';
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

    const stableIdToModuleId = new Map<string, string | number>();
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
          resolvedCount++;

          if (debug) {
            console.log(`[RSC] Resolved client: ${stableId} (${source})`);
          }
        }

        // Resolve deferred server references
        if (data.reactServerReference && isDeferredId(data.reactServerReference)) {
          const resolvedPath = extractPath(data.reactServerReference);
          const { stableId, source } = getStableId(resolvedPath, projectRoot);

          data.reactServerReference = stableId;
          stableIdToModuleId.set(stableId, serializerOptions.createModuleId(modulePath));
          resolvedCount++;

          if (debug) {
            console.log(`[RSC] Resolved server: ${stableId} (${source})`);
          }
        }

        // Also capture non-deferred IDs (app-level files)
        if (data.reactClientReference && !isDeferredId(data.reactClientReference)) {
          stableIdToModuleId.set(
            data.reactClientReference,
            serializerOptions.createModuleId(modulePath)
          );
        }
        if (data.reactServerReference && !isDeferredId(data.reactServerReference)) {
          stableIdToModuleId.set(
            data.reactServerReference,
            serializerOptions.createModuleId(modulePath)
          );
        }
      }
    }

    // Store mapping for SSR manifest
    if (!graph.transformOptions) {
      (graph as any).transformOptions = {};
    }
    if (!graph.transformOptions.customTransformOptions) {
      (graph.transformOptions as any).customTransformOptions = {};
    }
    (graph.transformOptions.customTransformOptions as any).__rscStableIdToModuleId =
      Object.fromEntries(stableIdToModuleId);

    if (debug && resolvedCount > 0) {
      console.log(`[RSC] Resolved ${resolvedCount} deferred stable IDs`);
    }

    return [entryPoint, preModules, graph, serializerOptions];
  };
}

/**
 * Get RSC stable ID mapping from graph (for SSR manifest).
 */
export function getRscStableIdToModuleId(
  graph: ReadOnlyGraph<MixedOutput>
): Record<string, string | number> {
  return (graph.transformOptions?.customTransformOptions as any)?.__rscStableIdToModuleId ?? {};
}
