/**
 * Copyright 2024-present 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { NodePath } from '@babel/traverse';
import type { CallExpression, Identifier, StringLiteral } from '@babel/types';
import * as types from '@babel/types';
type AsyncDependencyType = 'weak' | 'async' | 'prefetch';
export type AllowOptionalDependenciesWithOptions = {
    exclude: string[];
};
export type AllowOptionalDependencies = boolean | AllowOptionalDependenciesWithOptions;
export type Dependency = Readonly<{
    data: DependencyData;
    name: string;
}>;
export type ContextMode = 'sync' | 'eager' | 'lazy' | 'lazy-once';
type ContextFilter = Readonly<{
    pattern: string;
    flags: string;
}>;
export type RequireContextParams = Readonly<{
    recursive: boolean;
    filter: Readonly<ContextFilter>;
    mode: ContextMode;
}>;
type MutableDependencyData = {
    key: string;
    asyncType: AsyncDependencyType | null;
    isOptional?: boolean;
    locs: readonly types.SourceLocation[];
    contextParams?: RequireContextParams;
};
type DependencyData = Readonly<MutableDependencyData>;
export type MutableInternalDependency = MutableDependencyData & {
    locs: types.SourceLocation[];
    index: number;
    name: string;
};
export type InternalDependency = Readonly<MutableInternalDependency>;
export type State = {
    asyncRequireModulePathStringLiteral: StringLiteral | null;
    dependencyCalls: Set<string>;
    dependencyRegistry: DependencyRegistry;
    dependencyTransformer: DependencyTransformer;
    dynamicRequires: DynamicRequiresBehavior;
    dependencyMapIdentifier: Identifier | null;
    keepRequireNames: boolean;
    allowOptionalDependencies: AllowOptionalDependencies;
    unstable_allowRequireContext: boolean;
};
export type Options = Readonly<{
    asyncRequireModulePath: string;
    dependencyMapName: string | null;
    dynamicRequires: DynamicRequiresBehavior;
    inlineableCalls: readonly string[];
    keepRequireNames: boolean;
    allowOptionalDependencies: AllowOptionalDependencies;
    dependencyTransformer?: DependencyTransformer;
    unstable_allowRequireContext: boolean;
}>;
export type CollectedDependencies = Readonly<{
    ast: types.File;
    dependencyMapName: string;
    dependencies: readonly Dependency[];
}>;
export interface DependencyTransformer {
    transformSyncRequire(path: NodePath<CallExpression>, dependency: InternalDependency, state: State): void;
    transformImportCall(path: NodePath<any>, dependency: InternalDependency, state: State): void;
    transformPrefetch(path: NodePath<any>, dependency: InternalDependency, state: State): void;
    transformIllegalDynamicRequire(path: NodePath<any>, state: State): void;
}
export type DynamicRequiresBehavior = 'throwAtRuntime' | 'reject';
export type ImportQualifier = Readonly<{
    name: string;
    asyncType: AsyncDependencyType | null;
    optional: boolean;
    contextParams?: RequireContextParams;
}>;
declare class DependencyRegistry {
    _dependencies: Map<string, InternalDependency>;
    registerDependency(qualifier: ImportQualifier): InternalDependency;
    getDependencies(): InternalDependency[];
}
export {};
