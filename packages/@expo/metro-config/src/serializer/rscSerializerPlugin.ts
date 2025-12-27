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

import { getOutputKey, recordClientBoundary } from '../rscRegistry';
import type { SerializerParameters } from './withExpoSerializers';

/**
 * Normalize path for cross-platform consistency.
 */
function normalizePath(filePath: string): string {
  return filePath.replace(/\\+/g, '/');
}

/**
 * Check if ID is a file:// URL (used for assets).
 */
function isFileUrl(id: string): boolean {
  return id.startsWith('file://');
}

/**
 * Extract path from file:// URL.
 */
function extractPathFromFileUrl(fileUrl: string): string {
  const url = new URL(fileUrl);
  return normalizePath(url.pathname);
}

export interface RscSerializerPluginOptions {
  projectRoot: string;
  debug?: boolean;
}

/**
 * Serializer plugin that collects RSC metadata and builds module maps.
 */
export function createRscSerializerPlugin(options: RscSerializerPluginOptions) {
  const { projectRoot } = options;

  return async function rscSerializerPlugin(
    ...props: SerializerParameters
  ): Promise<SerializerParameters> {
    const [entryPoint, preModules, graph, serializerOptions] = props;

    // Maps output key → module ID (for runtime require())
    const outputKeyToModuleId = new Map<string, string | number>();
    // Maps output key → file path (for chunk lookup in SSR manifest)
    const outputKeyToFilePath = new Map<string, string>();

    // Helper to track output key usage
    function trackOutputKey(outputKey: string, modulePath: string, moduleId: string | number) {
      outputKeyToModuleId.set(outputKey, moduleId);
      outputKeyToFilePath.set(outputKey, modulePath);

      // Record in global cache for client bundle to use (dev mode)
      recordClientBoundary(outputKey, modulePath);
    }

    // First pass: collect output keys from metadata and convert file:// URLs to output keys
    for (const [modulePath, module] of graph.dependencies) {
      for (const output of module.output) {
        const data = output.data as {
          reactClientReference?: string;
          reactServerReference?: string;
        };

        // Handle client references
        if (data.reactClientReference) {
          let outputKey = data.reactClientReference;

          // Convert file:// URLs to output keys (modifies metadata in place)
          // This is needed for serializeChunks.ts which reads reactClientReference directly
          if (isFileUrl(outputKey)) {
            const resolvedPath = extractPathFromFileUrl(outputKey);
            outputKey = getOutputKey(resolvedPath, projectRoot).outputKey;
            data.reactClientReference = outputKey;
          }

          trackOutputKey(outputKey, modulePath, serializerOptions.createModuleId(modulePath));

          if (process.env.EXPO_DEBUG) {
            console.log('[RSC-SERIALIZER] Client ref:', outputKey, 'at', modulePath);
          }
        }

        // Handle server references
        if (data.reactServerReference) {
          let outputKey = data.reactServerReference;

          // Convert file:// URLs to output keys (modifies metadata in place)
          // This is needed for serializeChunks.ts which reads reactServerReference directly
          if (isFileUrl(outputKey)) {
            const resolvedPath = extractPathFromFileUrl(outputKey);
            outputKey = getOutputKey(resolvedPath, projectRoot).outputKey;
            data.reactServerReference = outputKey;
          }

          trackOutputKey(outputKey, modulePath, serializerOptions.createModuleId(modulePath));

          if (process.env.EXPO_DEBUG) {
            console.log('[RSC-SERIALIZER] Server ref:', outputKey, 'at', modulePath);
          }
        }
      }
    }

    // Second pass: replace __RSC_BOUNDARIES_PLACEHOLDER__ in virtual rsc.js module
    const RSC_BOUNDARIES_PLACEHOLDER = '__RSC_BOUNDARIES_PLACEHOLDER__';

    for (const [modulePath, module] of graph.dependencies) {
      if (!modulePath.includes('expo/virtual/rsc.js')) {
        continue;
      }

      for (const output of module.output) {
        const data = output.data as { code?: string };

        if (!data.code || !data.code.includes(RSC_BOUNDARIES_PLACEHOLDER)) {
          continue;
        }

        // Extract __BOUNDARY_PATHS__ array from the placeholder
        const boundaryPathsMatch = data.code.match(/__BOUNDARY_PATHS__:\s*(\[[^\]]*\])/);
        if (boundaryPathsMatch) {
          try {
            const boundaryPaths: string[] = JSON.parse(boundaryPathsMatch[1]);

            // Add boundaries to outputKeyToModuleId if they exist in the graph
            for (const boundaryPath of boundaryPaths) {
              const normalizedBoundary = normalizePath(boundaryPath);

              // Find this module in the graph
              let foundModulePath: string | null = null;
              for (const [graphModulePath] of graph.dependencies) {
                const normalizedGraphPath = normalizePath(graphModulePath);
                if (
                  normalizedGraphPath === normalizedBoundary ||
                  normalizedGraphPath.endsWith(
                    normalizedBoundary.replace(/^.*node_modules\//, 'node_modules/')
                  ) ||
                  normalizedBoundary.endsWith(
                    normalizedGraphPath.replace(/^.*node_modules\//, 'node_modules/')
                  )
                ) {
                  foundModulePath = graphModulePath;
                  break;
                }
              }

              if (foundModulePath) {
                const { outputKey } = getOutputKey(foundModulePath, projectRoot);
                if (!outputKeyToModuleId.has(outputKey)) {
                  const moduleId = serializerOptions.createModuleId(foundModulePath);
                  trackOutputKey(outputKey, foundModulePath, moduleId);
                }
              }
            }
          } catch (e) {
            console.warn('[RSC-SERIALIZER] Failed to parse __BOUNDARY_PATHS__:', e);
          }
        }

        // Build the module map
        const moduleMapEntries: string[] = [];
        for (const [outputKey, moduleId] of outputKeyToModuleId) {
          moduleMapEntries.push(
            `  ${JSON.stringify(outputKey)}: function() { return __r(${JSON.stringify(moduleId)}); }`
          );
        }

        const moduleMapCode = `{\n${moduleMapEntries.join(',\n')}\n}`;

        // Replace placeholder with actual module map
        const placeholderRegex =
          /(module|m)\.exports\s*=\s*\{[^}]*__RSC_BOUNDARIES_PLACEHOLDER__[^}]*\}/;

        const match = data.code.match(placeholderRegex);
        if (match) {
          const moduleVar = match[1];
          data.code = data.code.replace(placeholderRegex, `${moduleVar}.exports=${moduleMapCode}`);
        } else {
          console.warn('[RSC] Warning: Could not find placeholder pattern');
          data.code = `module.exports=${moduleMapCode}`;
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
    (graph.transformOptions.customTransformOptions as any).__rscOutputKeyToModuleId =
      Object.fromEntries(outputKeyToModuleId);
    (graph.transformOptions.customTransformOptions as any).__rscOutputKeyToFilePath =
      Object.fromEntries(outputKeyToFilePath);

    return [entryPoint, preModules, graph, serializerOptions];
  };
}

/**
 * Get RSC output key → module ID mapping from graph.
 */
export function getRscOutputKeyToModuleId(
  graph: ReadOnlyGraph<MixedOutput>
): Record<string, string | number> {
  return (graph.transformOptions?.customTransformOptions as any)?.__rscOutputKeyToModuleId ?? {};
}

/**
 * Get RSC output key → file path mapping from graph.
 */
export function getRscOutputKeyToFilePath(
  graph: ReadOnlyGraph<MixedOutput>
): Record<string, string> {
  return (graph.transformOptions?.customTransformOptions as any)?.__rscOutputKeyToFilePath ?? {};
}
