/**
 * Copyright © 2024 650 Industries.
 */
import type { ConfigAPI, PluginObj } from '@babel/core';
export declare const RSC_DEFERRED_PREFIX = "__RSC_DEFERRED__:";
/**
 * Check if a stable ID is deferred (needs serializer resolution).
 */
export declare function isDeferredStableId(stableId: string): boolean;
/**
 * Extract the resolved path from a deferred stable ID marker.
 */
export declare function extractResolvedPathFromDeferred(deferredId: string): string;
export declare function reactClientReferencesPlugin(api: ConfigAPI & typeof import('@babel/core')): PluginObj;
