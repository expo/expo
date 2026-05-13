/**
 * Copyright © 2026 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Babel plugin that transforms widget component JSX expressions.
 */
import type { ConfigAPI, NodePath, PluginObj, PluginPass, types as t } from '@babel/core';
export declare function widgetsPlugin(api: ConfigAPI & typeof import('@babel/core')): PluginObj<PluginPass & {
    widgetComponents?: Map<NodePath<t.Function>, {
        propNames: Set<string>;
        propsIdentifier?: string;
    }>;
}>;
