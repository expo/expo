/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Vendored from `@react-native/babel-preset`.
 * https://github.com/facebook/react-native/blob/main/packages/react-native-babel-preset/src/plugin-warn-on-deep-imports.js
 */
import type { ConfigAPI, PluginObj, PluginPass, types as t } from '@babel/core';
interface WarnDeepImportsState extends PluginPass {
    deepImports: DeepImportEntry[];
}
interface DeepImportEntry {
    source: string;
    loc: t.SourceLocation | null | undefined;
}
declare const _default: ({ types: t, }: ConfigAPI & typeof import("@babel/core")) => PluginObj<WarnDeepImportsState>;
export default _default;
