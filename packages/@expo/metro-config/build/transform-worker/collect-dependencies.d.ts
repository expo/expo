import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import type { CallExpression, Identifier, StringLiteral } from '@babel/types';
export type AsyncDependencyType = 'weak' | 'maybeSync' | 'async' | 'prefetch' | 'worker';
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
    /** A locally unique key for this dependency within the current module. */
    key: string;
    /** If null, then the dependency is synchronous. (ex. `require('foo')`) */
    asyncType: AsyncDependencyType | null;
    /**
     * If true, the dependency is declared using an ESM import, e.g.
     * "import x from 'y'" or "await import('z')". A resolver should typically
     * use this to assert either "import" or "require" for conditional exports
     * and subpath imports.
     */
    isESMImport: boolean;
    isOptional?: boolean;
    locs: readonly t.SourceLocation[];
    /** Context for requiring a collection of modules. */
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
    unstable_isESMImportAtSource: ((location: t.SourceLocation) => boolean) | null;
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
    unstable_isESMImportAtSource: ((location: t.SourceLocation) => boolean) | null;
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
    isESMImport: boolean;
    optional: boolean;
    contextParams?: RequireContextParams;
    exportNames: string[];
}>;
declare function collectDependencies<TAst extends t.File>(ast: TAst, options: Options): CollectedDependencies<TAst>;
export declare function getExportNamesFromPath(path: NodePath<any>): string[];
export declare class InvalidRequireCallError extends Error {
    constructor({ node }: NodePath<any>, message?: string);
}
/**
 * Given an import qualifier, return a key used to register the dependency.
 * Attributes can be appended to distinguish various combinations that would
 * otherwise be considered the same dependency edge.
 *
 * For example, the following dependencies would collapse into a single edge
 * if they simply utilized the `name` property:
 *
 * ```
 * require('./foo');
 * import foo from './foo'
 * await import('./foo')
 * require.context('./foo');
 * require.context('./foo', true, /something/);
 * require.context('./foo', false, /something/);
 * require.context('./foo', false, /something/, 'lazy');
 * ```
 *
 * This method should be utilized by `registerDependency`.
 */
export declare function getKeyForDependency(qualifier: Pick<ImportQualifier, 'asyncType' | 'contextParams' | 'isESMImport' | 'name'>): string;
export declare function hashKey(key: string): string;
declare class DependencyRegistry {
    private _dependencies;
    registerDependency(qualifier: ImportQualifier): InternalDependency;
    getDependencies(): InternalDependency[];
}
export default collectDependencies;
