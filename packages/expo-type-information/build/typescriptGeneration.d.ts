import ts from 'typescript';
import { ClassDeclaration, ConstructorDeclaration, EnumType, FileTypeInformation, FunctionDeclaration, ModuleClassDeclaration, RecordType, Type, ViewDeclaration } from './typeInformation';
/**
 * A helper type which contains the generated file content and name.
 */
export type OutputFile = {
    /**
     * @field Generated file content.
     */
    content: string;
    /**
     * @field Generated file base name (e.g. `ExpoSettings.types.ts`).
     */
    name: string;
};
export interface GenerationContext {
    fileInfo: FileTypeInformation;
    module: ModuleClassDeclaration;
    view: ViewDeclaration | null;
    missingTypes: Set<string>;
}
export declare function createDefaultGenerationContext(fileInfo: FileTypeInformation): GenerationContext | null;
export declare function getBasicTypesIdentifiers(): Set<string>;
export declare function joinTSNodesWithNewlines(nodes: ts.Node[][]): ts.Node[];
export declare function mapTypeToTsTypeNode(type: Type): ts.TypeNode;
export declare function buildViewPropsInterface(view: ViewDeclaration | null, options: {
    exported?: boolean;
}): ts.Node[];
export type buildFunctionOptions = {
    functionDeclaration: FunctionDeclaration;
    async?: boolean;
    method?: boolean;
    exported?: boolean;
    declaration?: boolean;
    returnStatement?: null | ts.ReturnStatement[];
    overrideArgumentDeclarations?: ts.ParameterDeclaration[];
    omitReturnType?: boolean;
};
export declare function buildFunction({ functionDeclaration, async, method, exported, declaration, returnStatement, overrideArgumentDeclarations, omitReturnType, }: buildFunctionOptions): ts.FunctionDeclaration | ts.MethodDeclaration;
export declare function buildConstructor(constructor: ConstructorDeclaration, declaration: boolean): ts.ClassElement;
type BuildClassOptions = {
    classDeclaration: ClassDeclaration;
    exported?: boolean;
    declaration?: boolean;
    getFunctionReturnBlock?: (functionDeclaration: FunctionDeclaration) => ts.ReturnStatement[];
};
export declare function buildClass({ classDeclaration, exported, declaration, getFunctionReturnBlock, }: BuildClassOptions): ts.ClassDeclaration;
export declare function buildUnknownTypeAlias(identifier: string, exported: boolean, inferredTypeParametersCount: Map<string, number>): ts.Statement;
export declare function buildRecordTypeAlias(recordType: RecordType, exported: boolean): ts.Node;
export declare function buildEnumTypeDeclaration(enumType: EnumType, exported: boolean, declared: boolean): ts.Node;
export declare function buildExposedTypesDeclarations(ctx: GenerationContext, options: {
    exported?: boolean;
    declare?: boolean;
}): ts.Node[];
export declare function getViewPropsTypeName(view: ViewDeclaration): string;
/**
 * Helper function that takes a file content string and formats it using `prettier` formatter.
 * @param text Content of a JavaScript/TypeScript file to format.
 * @param parser An option of which parser to use to format the file.
 * @default "babel"
 * @returns A promise which resolves to the `text` string after formatting using `prettier` with the given `parser`.
 * @header TypescriptGeneration
 */
export declare function prettifyCode(text: string, parser?: 'babel' | 'typescript'): Promise<string>;
/**
 * Generates the TypeScript string content for a native View's type declaration file.
 * @param fileTypeInformation The abstracted type information of an Expo module.
 * @returns A promise that resolves to a string containing the TypeScript declaration file content or `null` if the generation has failed.
 * @header TypescriptGeneration
 */
export declare function generateViewTypesFileContent(fileTypeInformation: FileTypeInformation): Promise<string | null>;
/**
 * Generates the TypeScript string content for a native View's type declaration file which mounts the View props on the global JSXIntrinsics.
 * @param fileTypeInformation The abstracted type information of an Expo module.
 * @returns A promise that resolves to a string containing the TypeScript declaration file content or `null` if the generation has failed.
 * @header TypescriptGeneration
 */
export declare function generateJSXIntrinsicsFileContent(fileTypeInformation: FileTypeInformation): Promise<string | null>;
/**
 * Generates the TypeScript string content for a native module type declaration file.
 * @param fileTypeInformation The abstracted type information of an Expo module.
 * @returns A promise that resolves to a string containing the TypeScript module declaration file content or `null` if the generation has failed.
 * @header TypescriptGeneration
 */
export declare function generateModuleTypesFileContent(fileTypeInformation: FileTypeInformation): Promise<string | null>;
/**
 * Generates a short TypeScript interface for an Expo module. This creates the content for two files: a volatile generated file containing raw type definitions,
 * and a stable user-facing file that wraps and exports the native module methods in new functions.
 * @param fileTypeInformation The abstracted type information of an Expo module.
 * @returns A promise that resolves to an object containing the string contents for both the volatile generated file and the stable TypeScript interface file.
 * @header TypescriptGeneration
 */
export declare function generateConciseTsInterface(fileTypeInformation: FileTypeInformation): Promise<{
    volatileGeneratedFileContent: string;
    moduleTypescriptInterfaceFileContent: string;
}>;
/**
 * Generates a full, multi-file TypeScript interface for an Expo module.
 * The generated interface is separated into a file with type definitions, a file which wraps the native module, a file for each view defined in a module and an index file which reexports all definitions from the other files.
 *
 * @param fileTypeInformation The abstracted type information of an Expo module.
 * @returns A promise that resolves to an object containing the string contents for all of the generated files or `null` if the generation has failed.
 * @header TypescriptGeneration
 */
export declare function generateFullTsInterface(fileTypeInformation: FileTypeInformation): Promise<{
    moduleTypesFile: OutputFile;
    moduleViewsFiles: OutputFile[];
    moduleNativeFile: OutputFile;
    indexFile: OutputFile;
} | null>;
export {};
