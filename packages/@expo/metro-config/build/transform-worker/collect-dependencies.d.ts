import type { ParseResult } from '@babel/parser';
import type { NodePath } from '@babel/traverse';
import * as types from '@babel/types';
import type { CallExpression, Identifier, StringLiteral } from '@babel/types';
type AsyncDependencyType = 'weak' | 'async' | 'prefetch';
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
    locs: readonly types.SourceLocation[];
    contextParams?: RequireContextParams;
};
type DependencyData = Readonly<MutableDependencyData>;
type MutableInternalDependency = MutableDependencyData & {
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
export type CollectedDependencies = Readonly<{
    ast: ParseResult<types.File>;
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
type ImportQualifier = Readonly<{
    name: string;
    asyncType: AsyncDependencyType | null;
    optional: boolean;
    contextParams?: RequireContextParams;
}>;
declare function collectDependencies(ast: CollectedDependencies['ast'], options: Options): CollectedDependencies;
declare class DependencyRegistry {
    private _dependencies;
    registerDependency(qualifier: ImportQualifier): InternalDependency;
    getDependencies(): InternalDependency[];
}
export declare class InvalidRequireCallError extends Error {
    constructor({ node }: NodePath<any>, message?: string);
}
export default collectDependencies;
