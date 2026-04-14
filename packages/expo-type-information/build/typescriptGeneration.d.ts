import ts from 'typescript';
import { Argument, ClassDeclaration, ConstructorDeclaration, EnumType, EventDeclaration, FileTypeInformation, FunctionDeclaration, PropDeclaration, RecordType, Type, ViewDeclaration } from './typeInformation';
export declare function basicTypesIdentifiers(): Set<string>;
export declare function getPropsTypeDeclaration(propsTypeName: string, propsDeclaration: PropDeclaration[], events: EventDeclaration[], exported?: boolean): ts.Node[];
export declare function getArgumentDeclarationAndName(arg: Argument): {
    argDeclaration: ts.ParameterDeclaration;
    argName: string;
};
export declare function getTsFunction({ functionDeclaration, async, method, exported, declaration, returnStatement, overrideArgumentDeclarations, includeReturnType, }: {
    functionDeclaration: FunctionDeclaration;
    async: boolean;
    method: boolean;
    exported: boolean;
    declaration: boolean;
    returnStatement?: null | ts.ReturnStatement[];
    overrideArgumentDeclarations?: ts.ParameterDeclaration[];
    includeReturnType?: boolean;
}): ts.FunctionDeclaration | ts.MethodDeclaration;
export declare function mapTypeToTsTypeNode(type: Type): ts.TypeNode;
export declare function getClassConstructorDeclaration(constructor: ConstructorDeclaration, declaration?: boolean): ts.ClassElement;
export declare function getTsClassDeclaration(classDeclaration: ClassDeclaration, fileTypeInformation: FileTypeInformation, exported: boolean, declaration: boolean, getFunctionReturnBlock: null | ((functionDeclaration: FunctionDeclaration, fileTypeInformation: FileTypeInformation) => ts.ReturnStatement[])): ts.ClassDeclaration;
export declare function getIdentifierUnknownDeclaration(identifier: string, exported: boolean, inferredTypeParametersCount: Map<string, number>): ts.Statement;
export declare function getRecordDeclaration(recordType: RecordType, exported: boolean): ts.Node;
export declare function getEnumDeclaration(enumType: EnumType, exported: boolean, declared: boolean): ts.Node;
export declare function getViewPropsTypeName(view: ViewDeclaration): string;
export declare function prettifyCode(text: string, parser?: 'babel' | 'typescript'): Promise<string>;
export declare function getGeneratedViewTypesFileContent(file: string, fileTypeInformation: FileTypeInformation): Promise<string | null>;
export declare function getGeneratedJSXIntrinsicsViewDeclaration(file: string, fileTypeInformation: FileTypeInformation): Promise<string | null>;
export declare function getGeneratedModuleTypesFileContent(file: string, fileTypeInformation: FileTypeInformation): Promise<string>;
export declare function getGeneratedModuleTypescriptInterface(file: string, fileTypeInformation: FileTypeInformation): Promise<{
    volitileGeneratedFileContent: string;
    moduleTypescriptInterfaceFileContent: string;
}>;
//# sourceMappingURL=typescriptGeneration.d.ts.map