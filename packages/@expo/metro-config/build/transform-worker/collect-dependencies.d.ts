import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import type { CallExpression, Identifier, StringLiteral } from '@babel/types';
export type AsyncDependencyType = 'weak' | 'maybeSync' | 'async' | 'prefetch';
type AllowOptionalDependenciesWithOptions = {
    exclude: string[];
};
type AllowOptionalDependencies = boolean | AllowOptionalDependenciesWithOptions;
export type Dependency = Readonly<{
    data: DependencyData;
    name: string;
}>;
type ContextMode = 'sync' | 'eager' | 'lazy' | 'lazy-once';
type ContextFilter = Readonly<{
    pattern: string;
    flags: string;
}>;
type RequireContextParams = Readonly<{
    recursive: boolean;
    filter: Readonly<ContextFilter>;
    mode: ContextMode;
}>;
type MutableDependencyData = {
    key: string;
    asyncType: AsyncDependencyType | null;
    isOptional?: boolean;
    locs: readonly t.SourceLocation[];
    contextParams?: RequireContextParams;
    exportNames: string[];
    css?: {
        url: string;
        supports: string | null;
        media: string | null;
    };
};
export type DependencyData = Readonly<MutableDependencyData>;
type MutableInternalDependency = MutableDependencyData & {
    locs: t.SourceLocation[];
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
    /** Indicates that the pass should only collect dependencies and avoid mutating the AST. This is used for tree shaking passes. */
    collectOnly?: boolean;
};
export type Options = Readonly<{
    asyncRequireModulePath: string;
    dependencyMapName?: string | null;
    dynamicRequires: DynamicRequiresBehavior;
    inlineableCalls: readonly string[];
    keepRequireNames: boolean;
    allowOptionalDependencies: AllowOptionalDependencies;
    dependencyTransformer?: DependencyTransformer;
    unstable_allowRequireContext: boolean;
    /** Indicates that the pass should only collect dependencies and avoid mutating the AST. This is used for tree shaking passes. */
    collectOnly?: boolean;
}>;
export type CollectedDependencies<TAst extends t.File = t.File> = Readonly<{
    ast: TAst;
    dependencyMapName: string;
    dependencies: readonly Dependency[];
}>;
export interface DependencyTransformer {
    transformSyncRequire(path: NodePath<CallExpression>, dependency: InternalDependency, state: State): void;
    transformImportMaybeSyncCall(path: NodePath<any>, dependency: InternalDependency, state: State): void;
    transformImportCall(path: NodePath<any>, dependency: InternalDependency, state: State): void;
    transformPrefetch(path: NodePath<any>, dependency: InternalDependency, state: State): void;
    transformIllegalDynamicRequire(path: NodePath<any>, state: State): void;
}
export type DynamicRequiresBehavior = 'throwAtRuntime' | 'reject' | 'warn';
type ImportQualifier = Readonly<{
    name: string;
    asyncType: AsyncDependencyType | null;
    optional: boolean;
    contextParams?: RequireContextParams;
    exportNames: string[];
}>;
declare function collectDependencies<TAst extends t.File>(ast: TAst, options: Options): CollectedDependencies<TAst>;
export declare function getExportNamesFromPath(path: NodePath<any>): string[];
declare class DependencyRegistry {
    private _dependencies;
    registerDependency(qualifier: ImportQualifier): InternalDependency;
    getDependencies(): InternalDependency[];
}
export declare class InvalidRequireCallError extends Error {
    constructor({ node }: NodePath<any>, message?: string);
}
export default collectDependencies;
