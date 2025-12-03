import ts from 'typescript';
import { Argument, ClassDeclaration, ConstructorDeclaration, EnumType, EventDeclaration, FileTypeInformation, FunctionDeclaration, PropDeclaration, RecordType, Type, ViewDeclaration } from './typeInformation';
export declare function getPropsTypeDeclaration(propsTypeName: string, propsDeclaration: PropDeclaration[], events: EventDeclaration[], exported?: boolean): ts.Node[];
export declare function wrapWithPromise(typeNode: ts.TypeNode): ts.TypeNode;
export declare function getArgumentDeclaration(arg: Argument): ts.ParameterDeclaration;
export declare function getTsFunction(functionDeclaration: FunctionDeclaration, async: boolean, method: boolean, exported: boolean, declaration: boolean, returnStatement?: null | ts.ReturnStatement[]): ts.FunctionDeclaration | ts.MethodDeclaration;
export declare function mapTypeToTsTypeNode(type: Type): ts.TypeNode;
export declare function getClassConstructorDeclaration(constructor: ConstructorDeclaration, declaration?: boolean): ts.ClassElement;
export declare function getTsClass(classDeclaration: ClassDeclaration, fileTypeInformation: FileTypeInformation, exported: boolean, declaration: boolean, getFunctionReturnBlock: null | ((functionDeclaration: FunctionDeclaration, fileTypeInformation: FileTypeInformation) => ts.ReturnStatement[])): ts.ClassDeclaration;
export declare function getIdentifierAnyDeclaration(identifier: string, typeParametersCount: Map<string, number>): ts.Node;
export declare function getRecordDeclaration(recordType: RecordType): ts.Node;
export declare function getEnumDeclaration(enumType: EnumType): ts.Node;
export declare function getViewPropsTypeName(view: ViewDeclaration): string;
export declare function prettifyCode(text: string, parser?: 'babel' | 'typescript'): Promise<string>;
export declare function basicTypesIdentifiers(): Set<string>;
export declare function getGeneratedViewTypesFileContent(file: string, fileTypeInformation: FileTypeInformation): Promise<string>;
export declare function getGeneratedModuleTypesFileContent(file: string, fileTypeInformation: FileTypeInformation): Promise<string>;
//# sourceMappingURL=typescriptGeneration.d.ts.map