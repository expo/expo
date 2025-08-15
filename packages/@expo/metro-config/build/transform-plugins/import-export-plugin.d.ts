/**
 * Copyright (c) 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { ConfigAPI, PluginObj, types as t } from '@babel/core';
export type Options = Readonly<{
    importDefault: string;
    importAll: string;
    resolve: boolean;
    /** Whether to use live bindings for exports and import. Improves circular dependencies resolution. */
    liveBindings?: boolean;
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
        namespace?: string;
        [key: string]: unknown;
    }[];
    exportNamed: {
        local: string;
        remote: string;
        loc?: t.SourceLocation | null;
        namespace?: string;
        [key: string]: unknown;
    }[];
    imports: {
        node: t.Statement;
    }[];
    importDefault: t.Node;
    importAll: t.Node;
    opts: Options;
    importedIdentifiers: Map<string, {
        source: string;
        imported: string;
    }>;
    namespaceForLocal: Map<string, {
        namespace: string;
        remote: string;
    }>;
    [key: string]: unknown;
};
export declare function importExportPlugin({ types: t, }: ConfigAPI & typeof import('@babel/core')): PluginObj<State>;
export {};
