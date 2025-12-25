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

/**
 * Normalize path for cross-platform consistency.
 * - Converts backslashes to forward slashes
 * - Handles escaped backslashes from JS string literals (\\)
 */
function normalizePath(filePath: string): string {
  // Handle escaped backslashes in JS strings (e.g., "C:\\Users\\...")
  // and regular backslashes (e.g., "C:\Users\...")
  return filePath.replace(/\\+/g, '/');
}

function isDeferredId(id: string): boolean {
  return id.startsWith(RSC_DEFERRED_PREFIX);
}

function extractPath(deferredId: string): string {
  const rawPath = deferredId.slice(RSC_DEFERRED_PREFIX.length);
  return normalizePath(rawPath);
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
    // Track collisions: stable ID → list of file paths that resolve to it
    const stableIdCollisions = new Map<string, string[]>();
    let resolvedCount = 0;

    // Helper to track stable ID usage and detect collisions
    function trackStableId(stableId: string, modulePath: string, moduleId: string | number) {
      const existingPath = stableIdToFilePath.get(stableId);
      if (existingPath && existingPath !== modulePath) {
        // Collision detected: same stable ID maps to different files
        const collisions = stableIdCollisions.get(stableId) ?? [existingPath];
        if (!collisions.includes(modulePath)) {
          collisions.push(modulePath);
        }
        stableIdCollisions.set(stableId, collisions);

        if (debug) {
          console.warn(
            `[RSC] Warning: Stable ID collision detected for "${stableId}":\n` +
              `  Previous: ${existingPath}\n` +
              `  Current:  ${modulePath}\n` +
              `  The last occurrence will be used. This may cause issues with pnpm or aliased packages.`
          );
        }
      }
      stableIdToModuleId.set(stableId, moduleId);
      stableIdToFilePath.set(stableId, modulePath);
    }

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
          trackStableId(stableId, modulePath, serializerOptions.createModuleId(modulePath));
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
          trackStableId(stableId, modulePath, serializerOptions.createModuleId(modulePath));
          deferredToStableId.set(deferredId, stableId);
          resolvedCount++;

          if (debug) {
            console.log(`[RSC] Resolved server: ${stableId} -> ${modulePath} (${source})`);
          }
        }

        // Also capture non-deferred IDs (app-level files)
        if (data.reactClientReference && !isDeferredId(data.reactClientReference)) {
          trackStableId(
            data.reactClientReference,
            modulePath,
            serializerOptions.createModuleId(modulePath)
          );
        }
        if (data.reactServerReference && !isDeferredId(data.reactServerReference)) {
          trackStableId(
            data.reactServerReference,
            modulePath,
            serializerOptions.createModuleId(modulePath)
          );
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
            data.code = data.code.replace(deferredIdRegex, (match, quote, rawPath) => {
              // Normalize path for Windows compatibility (handles escaped backslashes)
              const normalizedPath = normalizePath(rawPath);
              const deferredId = RSC_DEFERRED_PREFIX + normalizedPath;
              const stableId = deferredToStableId.get(deferredId);
              if (stableId) {
                return `${quote}${stableId}${quote}`;
              }
              // Fallback: resolve directly if not in map
              const { stableId: fallbackId } = getStableId(normalizedPath, projectRoot);
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

    // Warn about stable ID collisions (even without debug flag)
    if (stableIdCollisions.size > 0) {
      const collisionSummary = Array.from(stableIdCollisions.entries())
        .map(([stableId, paths]) => `  "${stableId}":\n${paths.map((p) => `    - ${p}`).join('\n')}`)
        .join('\n');
      console.warn(
        `[RSC] Warning: ${stableIdCollisions.size} stable ID collision(s) detected.\n` +
          `This can happen with pnpm, multiple package versions, or aliased imports.\n` +
          `The last occurrence of each will be used, which may cause incorrect module resolution:\n` +
          collisionSummary
      );
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
