/**
 * Copyright © 2024 650 Industries.
 */
import { ConfigAPI, types } from '@babel/core';
export declare function detectDynamicExports(api: ConfigAPI & {
    types: typeof types;
}): babel.PluginObj;
