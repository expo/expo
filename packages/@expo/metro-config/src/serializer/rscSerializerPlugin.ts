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

/**
 * Create a regex to match deferred IDs in code.
 * Matches: "__RSC_DEFERRED__:/path/to/file.js" (with quotes)
 */
function createDeferredIdRegex(): RegExp {
  // Match the deferred prefix followed by any path, inside quotes
  // Handles both single and double quotes
  return new RegExp(
    `(["'])${RSC_DEFERRED_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^"']+)\\1`,
    'g'
  );
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
    // Maps deferred ID → stable ID (for code rewriting)
    const deferredToStableId = new Map<string, string>();
    let resolvedCount = 0;

    // First pass: build mappings from metadata
    for (const [modulePath, module] of graph.dependencies) {
      for (const output of module.output) {
        const data = output.data as {
          reactClientReference?: string;
          reactServerReference?: string;
        };

        // Resolve deferred client references
        if (data.reactClientReference && isDeferredId(data.reactClientReference)) {
          const deferredId = data.reactClientReference;
          const resolvedPath = extractPath(deferredId);
          const { stableId, source } = getStableId(resolvedPath, projectRoot);

          data.reactClientReference = stableId;
          stableIdToModuleId.set(stableId, serializerOptions.createModuleId(modulePath));
          stableIdToFilePath.set(stableId, modulePath);
          deferredToStableId.set(deferredId, stableId);
          resolvedCount++;

          if (debug) {
            console.log(`[RSC] Resolved client: ${stableId} -> ${modulePath} (${source})`);
          }
        }

        // Resolve deferred server references
        if (data.reactServerReference && isDeferredId(data.reactServerReference)) {
          const deferredId = data.reactServerReference;
          const resolvedPath = extractPath(deferredId);
          const { stableId, source } = getStableId(resolvedPath, projectRoot);

          data.reactServerReference = stableId;
          stableIdToModuleId.set(stableId, serializerOptions.createModuleId(modulePath));
          stableIdToFilePath.set(stableId, modulePath);
          deferredToStableId.set(deferredId, stableId);
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

    // Second pass: rewrite code to replace deferred IDs with stable IDs
    if (deferredToStableId.size > 0) {
      const deferredIdRegex = createDeferredIdRegex();

      for (const [, module] of graph.dependencies) {
        for (const output of module.output) {
          const data = output.data as { code?: string };
          if (data.code && data.code.includes(RSC_DEFERRED_PREFIX)) {
            data.code = data.code.replace(deferredIdRegex, (match, quote, path) => {
              const deferredId = RSC_DEFERRED_PREFIX + path;
              const stableId = deferredToStableId.get(deferredId);
              if (stableId) {
                return `${quote}${stableId}${quote}`;
              }
              // Fallback: resolve directly if not in map
              const { stableId: fallbackId } = getStableId(path, projectRoot);
              return `${quote}${fallbackId}${quote}`;
            });
          }
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
