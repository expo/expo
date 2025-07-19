/**
 * Copyright © 2024 650 Industries.
 */
import type { ConfigAPI, PluginObj } from '@babel/core';
/**
 * Inlines environment variables to configure the process:
 *
 * EXPO_PROJECT_ROOT
 * EXPO_ROUTER_ABS_APP_ROOT
 * EXPO_ROUTER_APP_ROOT
 * EXPO_ROUTER_IMPORT_MODE
 */
export declare function expoRouterBabelPlugin(api: ConfigAPI & typeof import('@babel/core')): PluginObj;
