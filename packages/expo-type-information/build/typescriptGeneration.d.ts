import ts from 'typescript';
import { Argument, ClassDeclaration, ConstructorDeclaration, EnumType, FileTypeInformation, FunctionDeclaration, ModuleClassDeclaration, RecordType, Type, ViewDeclaration } from './typeInformation';
export type OutputFile = {
    content: string;
    name: string;
};
export interface GenerationContext {
    fileInfo: FileTypeInformation;
    module: ModuleClassDeclaration;
    view: ViewDeclaration | null;
    missingTypes: Set<string>;
}
export declare function createDefaultGenerationContext(fileInfo: FileTypeInformation): GenerationContext | null;
export declare function basicTypesIdentifiers(): Set<string>;
export declare function joinTSNodesWithNewlines(nodes: ts.Node[][]): ts.Node[];
export declare function getViewPropsDeclaration(view: ViewDeclaration | null, options: {
    export?: boolean;
}): ts.Node[];
export declare function getArgumentDeclarationAndName(arg: Argument): {
    argDeclaration: ts.ParameterDeclaration;
    argName: string;
};
export declare function getTsFunction({ functionDeclaration, async, method, exported, declaration, returnStatement, overrideArgumentDeclarations, omitReturnType, }: {
    functionDeclaration: FunctionDeclaration;
    async?: boolean;
    method?: boolean;
    exported?: boolean;
    declaration?: boolean;
    returnStatement?: null | ts.ReturnStatement[];
    overrideArgumentDeclarations?: ts.ParameterDeclaration[];
    omitReturnType?: boolean;
}): ts.FunctionDeclaration | ts.MethodDeclaration;
export declare function mapTypeToTsTypeNode(type: Type): ts.TypeNode;
export declare function getClassConstructorDeclaration(constructor: ConstructorDeclaration, declaration: boolean): ts.ClassElement;
export declare function getTsClassDeclaration({ classDeclaration, exported, declaration, getFunctionReturnBlock, }: {
    classDeclaration: ClassDeclaration;
    exported?: boolean;
    declaration?: boolean;
    getFunctionReturnBlock?: (functionDeclaration: FunctionDeclaration) => ts.ReturnStatement[];
}): ts.ClassDeclaration;
export declare function getIdentifierUnknownDeclaration(identifier: string, exported: boolean, inferredTypeParametersCount: Map<string, number>): ts.Statement;
export declare function getRecordDeclaration(recordType: RecordType, exported: boolean): ts.Node;
export declare function getEnumDeclaration(enumType: EnumType, exported: boolean, declared: boolean): ts.Node;
export declare function getTypeDeclarations(ctx: GenerationContext, options: {
    export?: boolean;
    declare?: boolean;
}): ts.Node[];
export declare function getViewPropsTypeName(view: ViewDeclaration): string;
export declare function prettifyCode(text: string, parser?: 'babel' | 'typescript'): Promise<string>;
export declare function getGeneratedViewTypesFileContent(fileTypeInformation: FileTypeInformation): Promise<string | null>;
export declare function getGeneratedJSXIntrinsicsViewDeclaration(fileTypeInformation: FileTypeInformation): Promise<string | null>;
export declare function getGeneratedModuleTypesFileContent(fileTypeInformation: FileTypeInformation): Promise<string | null>;
export declare function getGeneratedModuleTypescriptInterface(fileTypeInformation: FileTypeInformation): Promise<{
    volitileGeneratedFileContent: string;
    moduleTypescriptInterfaceFileContent: string;
}>;
export declare function getGeneratedExpoModuleTypescriptFilesContents(fileTypeInformation: FileTypeInformation): Promise<{
    moduleTypesFile: OutputFile;
    moduleViewFile: OutputFile;
    moduleNativeFile: OutputFile;
    indexFile: OutputFile;
} | null>;
//# sourceMappingURL=typescriptGeneration.d.ts.map