/**
 * Copyright © 2024 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { ConfigAPI, PluginObj, types as t } from '@babel/core';
interface ImportRef {
    source: string;
    loc?: t.SourceLocation | null;
}
interface State {
    filename: string;
    isExcluded: boolean;
    require: ImportRef[];
    import: ImportRef[];
    export: ImportRef[];
}
export declare const reactNativeWarnOnDeepImportsPlugin: ({ types: t, caller, }: ConfigAPI & typeof import("@babel/core")) => PluginObj<State>;
export {};
