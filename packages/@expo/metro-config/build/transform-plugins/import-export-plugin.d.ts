/**
 * Copyright (c) 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { PluginObj, types as t } from '@babel/core';
type Types = typeof import('@babel/core').types;
export type Options = Readonly<{
    importDefault: string;
    importAll: string;
    resolve: boolean;
    out?: {
        isESModule: boolean;
        [key: string]: unknown;
    };
}>;
type State = {
    exportAll: {
        file: string;
        loc?: t.SourceLocation | null;
        [key: string]: unknown;
    }[];
    exportDefault: {
        local: string;
        loc?: t.SourceLocation | null;
        [key: string]: unknown;
    }[];
    exportNamed: {
        local: string;
        remote: string;
        loc?: t.SourceLocation | null;
        [key: string]: unknown;
    }[];
    imports: {
        node: t.Statement;
    }[];
    importDefault: t.Node;
    importAll: t.Node;
    opts: Options;
    [key: string]: unknown;
};
export declare function importExportPlugin({ types: t }: {
    types: Types;
}): PluginObj<State>;
export {};
