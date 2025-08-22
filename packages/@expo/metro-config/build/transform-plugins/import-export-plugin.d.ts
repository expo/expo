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
declare class MapToArray<K, V> extends Map<K, V[]> {
    getOrDefault(key: K): V[];
}
declare class MapToFirst<K, V> extends Map<K, V> {
    setFirst(key: K, value: V): this;
}
type State = {
    importDefault: t.Node;
    importAll: t.Node;
    opts: Options;
    originalImportOrder: MapToFirst<string, t.StringLiteral>;
    exportAllFrom: Map<string, {
        loc: t.SourceLocation | null | undefined;
    }>;
    importAllFromAs: MapToArray<string, {
        loc: t.SourceLocation | null | undefined;
        as: string;
    }>;
    exportAllFromAs: MapToArray<string, {
        loc: t.SourceLocation | null | undefined;
        as: string;
    }>;
    importDefaultFromAs: MapToArray<string, {
        loc: t.SourceLocation | null | undefined;
        as: t.Identifier;
    }>;
    exportDefault: {
        loc: t.SourceLocation | null | undefined;
        name: string;
    }[];
    exportNamedFrom: MapToArray<string, {
        loc: t.SourceLocation | null | undefined;
        name: string;
        as: string;
    }>;
    importNamedFrom: MapToArray<string, {
        loc: t.SourceLocation | null | undefined;
        name: string;
        as: string;
    }>;
    exportNamed: {
        loc: t.SourceLocation | null | undefined;
        name: string;
        as: string;
    }[];
    importSideEffect: Map<string, {
        loc: t.SourceLocation | null | undefined;
    }>;
    [key: string]: unknown;
};
export declare function importExportPlugin({ types: t, }: ConfigAPI & typeof import('@babel/core')): PluginObj<State>;
export {};
