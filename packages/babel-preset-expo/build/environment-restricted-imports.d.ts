/**
 * Copyright © 2024 650 Industries.
 */
import { ConfigAPI, types } from '@babel/core';
/** Prevent importing certain known imports in given environments. This is for sanity to ensure a module never accidentally gets imported unexpectedly. */
export declare function environmentRestrictedImportsPlugin(api: ConfigAPI & {
    types: typeof types;
}): babel.PluginObj;
