/**
 * Copyright © 2024 650 Industries.
 */
import type { ConfigAPI, PluginObj } from '@babel/core';
/** Prevent importing certain known imports in given environments. This is for sanity to ensure a module never accidentally gets imported unexpectedly. */
export declare function environmentRestrictedImportsPlugin(api: ConfigAPI & typeof import('@babel/core')): PluginObj;
