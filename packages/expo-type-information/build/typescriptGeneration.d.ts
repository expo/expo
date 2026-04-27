import ts from 'typescript';
import { ClassDeclaration, ConstructorDeclaration, EnumType, FileTypeInformation, FunctionDeclaration, ModuleClassDeclaration, RecordType, Type, ViewDeclaration } from './typeInformation';
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
export declare function getBasicTypesIdentifiers(): Set<string>;
export declare function joinTSNodesWithNewlines(nodes: ts.Node[][]): ts.Node[];
export declare function mapTypeToTsTypeNode(type: Type): ts.TypeNode;
export declare function buildViewPropsInterface(view: ViewDeclaration | null, options: {
    exported?: boolean;
}): ts.Node[];
export declare function buildFunction({ functionDeclaration, async, method, exported, declaration, returnStatement, overrideArgumentDeclarations, omitReturnType, }: {
    functionDeclaration: FunctionDeclaration;
    async?: boolean;
    method?: boolean;
    exported?: boolean;
    declaration?: boolean;
    returnStatement?: null | ts.ReturnStatement[];
    overrideArgumentDeclarations?: ts.ParameterDeclaration[];
    omitReturnType?: boolean;
}): ts.FunctionDeclaration | ts.MethodDeclaration;
export declare function buildConstructor(constructor: ConstructorDeclaration, declaration: boolean): ts.ClassElement;
export declare function buildClass({ classDeclaration, exported, declaration, getFunctionReturnBlock, }: {
    classDeclaration: ClassDeclaration;
    exported?: boolean;
    declaration?: boolean;
    getFunctionReturnBlock?: (functionDeclaration: FunctionDeclaration) => ts.ReturnStatement[];
}): ts.ClassDeclaration;
export declare function buildUnknownTypeAlias(identifier: string, exported: boolean, inferredTypeParametersCount: Map<string, number>): ts.Statement;
export declare function buildRecordTypeAlias(recordType: RecordType, exported: boolean): ts.Node;
export declare function buildEnumTypeDeclaration(enumType: EnumType, exported: boolean, declared: boolean): ts.Node;
export declare function buildExposedTypesDeclarations(ctx: GenerationContext, options: {
    exported?: boolean;
    declare?: boolean;
}): ts.Node[];
export declare function getViewPropsTypeName(view: ViewDeclaration): string;
export declare function prettifyCode(text: string, parser?: 'babel' | 'typescript'): Promise<string>;
export declare function generateViewTypesFileContent(fileTypeInformation: FileTypeInformation): Promise<string | null>;
export declare function generateJSXIntrinsicsFileContent(fileTypeInformation: FileTypeInformation): Promise<string | null>;
export declare function generateModuleTypesFileContent(fileTypeInformation: FileTypeInformation): Promise<string | null>;
export declare function generateConciseTsInterface(fileTypeInformation: FileTypeInformation): Promise<{
    volitileGeneratedFileContent: string;
    moduleTypescriptInterfaceFileContent: string;
}>;
export declare function generateFullTsInterface(fileTypeInformation: FileTypeInformation): Promise<{
    moduleTypesFile: OutputFile;
    moduleViewsFiles: OutputFile[];
    moduleNativeFile: OutputFile;
    indexFile: OutputFile;
} | null>;
//# sourceMappingURL=typescriptGeneration.d.ts.map