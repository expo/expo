import type { ConfigAPI, PluginObj, types as t } from '@babel/core';
export interface Options {
    readonly resolve: boolean;
    readonly out?: {
        isESModule: boolean;
    };
}
type ModuleRequest = t.StringLiteral;
type ModuleSource = string;
type ID = string;
declare const enum ImportDeclarationKind {
    REQUIRE = "REQUIRE",
    IMPORT_DEFAULT = "DEFAULT",
    IMPORT_NAMESPACE = "NAMESPACE"
}
/** Record of specifiers (arbitrary name, default, or namespace import, to local IDs) */
interface ModuleSpecifiers {
    [ImportDeclarationKind.REQUIRE]?: ID;
    [ImportDeclarationKind.IMPORT_DEFAULT]?: ID;
    [ImportDeclarationKind.IMPORT_NAMESPACE]?: ID;
    /** Marks that the require call should be kept due to a side-effect */
    sideEffect?: boolean;
}
/** Instruction for how to replace an expression when inlining */
interface InlineRef {
    /** ID to access (MemberExpression.object) */
    parentId: ID;
    /** Specifier property to access (undefined for direct namespace access) */
    member: 'default' | (string & {}) | undefined;
}
interface ImportDeclaration {
    kind: ImportDeclarationKind;
    source: ModuleRequest;
    local: ID | undefined;
    loc: t.SourceLocation | null | undefined;
}
interface ExportDeclaration {
    statement: t.Statement;
    local: ID | undefined;
}
interface State {
    readonly opts: Options;
    importSpecifiers: Map<ModuleSource, ModuleSpecifiers>;
    /** Identifiers referencing import specifiers that should be rewritten (ID/key will be replaced) */
    inlineBodyRefs: Map<ID, InlineRef>;
    /** Identifiers by name that are referenced in the output */
    referencedLocals: Set<ID>;
    /** Cached untransformed export statements */
    exportStatements: t.ExportNamedDeclaration[];
    /** Transformed exports to add to the body, while referencing ID */
    exportDeclarations: ExportDeclaration[];
    /** Transformed export namespaces to add to the body, while referencing ID */
    exportAll: Map<ID, t.Statement>;
    /** Transformed imports to add to the body, if IDs referenced */
    importDeclarations: ImportDeclaration[];
}
export declare function importExportLiveBindingsPlugin({ template, types: t, }: ConfigAPI & typeof import('@babel/core')): PluginObj<State>;
export {};
