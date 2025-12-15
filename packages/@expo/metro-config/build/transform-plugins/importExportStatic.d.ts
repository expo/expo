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
    out?: {
        isESModule: boolean;
        [key: string]: unknown;
    };
}>;
type State = {
    importDefault: t.Node;
    importAll: t.Node;
    opts: Options;
    originalImportOrder: Map<string, t.StringLiteral>;
    exportAllFrom: Map<string, {
        loc: t.SourceLocation | null | undefined;
    }>;
    importAllFromAs: Map<string, {
        loc: t.SourceLocation | null | undefined;
        as: string;
    }[]>;
    exportAllFromAs: Map<string, {
        loc: t.SourceLocation | null | undefined;
        as: string;
    }[]>;
    importDefaultFromAs: Map<string, {
        loc: t.SourceLocation | null | undefined;
        as: t.Identifier;
    }[]>;
    exportDefault: {
        loc: t.SourceLocation | null | undefined;
        name: string;
    }[];
    exportNamedFrom: Map<string, {
        loc: t.SourceLocation | null | undefined;
        name: string;
        as: string;
    }[]>;
    importNamedFrom: Map<string, {
        loc: t.SourceLocation | null | undefined;
        name: string;
        as: string;
    }[]>;
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
