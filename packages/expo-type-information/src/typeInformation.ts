import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { getSwiftFileTypeInformation } from './swiftSourcekittenTypegen/swiftSourcekittenTypeInformation';

export type ParametrizedType = {
  name: TypeIdentifier;
  types: Type[];
};

// export type ProductType = {
//   types: Type[];
// };

export type Argument = { name: string; type: Type };
export type Field = Argument;

export type RecordType = {
  name: string;
  fields: Field[];
};

export type EnumCase = string;

export type EnumType = {
  name: string;
  cases: EnumCase[];
};

export type SumType = {
  types: Type[];
};

// export type FunctionType = {
//   arguments: Argument[];
//   returnType: Type;
// };

export type OptionalType = Type;
export type ArrayType = Type;

export type TypeIdentifier = string;
export type AnonymousType =
  | ParametrizedType
  | SumType
  // | FunctionType
  | OptionalType
  | DictionaryType
  | ArrayType;

export enum TypeKind {
  BASIC,
  IDENTIFIER,
  SUM,
  // FUNCTION,
  PARAMETRIZED,
  OPTIONAL,
  ARRAY,
  DICTIONARY,
}

export enum BasicType {
  ANY,
  STRING,
  NUMBER,
  BOOLEAN,
  VOID,
  UNDEFINED,
  UNRESOLVED,
}

export type Type = {
  kind: TypeKind;
  type: BasicType | TypeIdentifier | AnonymousType;
};

export type PropertyDeclaration = ConstantDeclaration;
export type ViewDeclaration = ModuleClassDeclaration;
export type EventDeclaration = string;

export type ConstantDeclaration = {
  name: string;
  type: Type;
};

export type FunctionDeclaration = {
  name: string;
  returnType: Type;
  arguments: Argument[];
  parameters: Type[];
};

export type PropDeclaration = {
  name: string;
  arguments: Argument[];
};

export type ConstructorDeclaration = {
  arguments: Argument[];
};

export type DictionaryType = {
  key: Type;
  value: Type;
};

export type ClassDeclaration = {
  name: string;
  constructor: ConstructorDeclaration | null;
  methods: FunctionDeclaration[];
  asyncMethods: FunctionDeclaration[];
  properties: PropertyDeclaration[];
};

export type ModuleClassDeclaration = {
  name: string;
  constructor: ConstructorDeclaration | null;
  constants: ConstantDeclaration[];
  classes: ClassDeclaration[];
  functions: FunctionDeclaration[];
  asyncFunctions: FunctionDeclaration[];
  properties: PropertyDeclaration[];
  props: PropDeclaration[];
  views: ViewDeclaration[];
  events: EventDeclaration[];
};

export type FileTypeInformation = {
  usedTypeIdentifiers: Set<string>;
  declaredTypeIdentifiers: Set<string>;
  typeParametersCount: Map<string, number>;
  functions: FunctionDeclaration[];
  moduleClasses: ModuleClassDeclaration[];
  records: RecordType[];
  enums: EnumType[];
};

export type FileTypeInformationSerialized = {
  usedTypeIdentifiersList: string[];
  declaredTypeIdentifiersList: string[];
  typeParametersCountList: [string, number][];
  functions: FunctionDeclaration[];
  moduleClasses: ModuleClassDeclaration[];
  records: RecordType[];
  enums: EnumType[];
};

export function serializeTypeInformation({
  usedTypeIdentifiers,
  declaredTypeIdentifiers,
  typeParametersCount,
  functions,
  moduleClasses,
  records,
  enums,
}: FileTypeInformation): FileTypeInformationSerialized {
  return {
    usedTypeIdentifiersList: [...usedTypeIdentifiers.keys()],
    declaredTypeIdentifiersList: [...declaredTypeIdentifiers.keys()],
    functions,
    typeParametersCountList: [...typeParametersCount.entries()],
    moduleClasses,
    records,
    enums,
  };
}

export function deserializeTypeInformation({
  usedTypeIdentifiersList,
  declaredTypeIdentifiersList,
  typeParametersCountList,
  functions,
  moduleClasses,
  records,
  enums,
}: FileTypeInformationSerialized): FileTypeInformation {
  return {
    usedTypeIdentifiers: new Set<string>(usedTypeIdentifiersList),
    declaredTypeIdentifiers: new Set<string>(declaredTypeIdentifiersList),
    typeParametersCount: new Map<string, number>(typeParametersCountList),
    functions,
    moduleClasses,
    records,
    enums,
  };
}

export function getFileTypeInformation(absoluteFilePath: string): FileTypeInformation | null {
  if (absoluteFilePath.endsWith('.swift')) {
    return getSwiftFileTypeInformation(absoluteFilePath);
  }
  return null;
}

export function getFileTypeInformationForString(
  content: string,
  language: 'swift'
): FileTypeInformation | null {
  if (language === 'swift') {
    const tmp = os.tmpdir();
    const filePath = path.resolve(tmp, 'TypeInformationTemporaryFile.swift');
    fs.writeFileSync(filePath, content, 'utf8');
    const fileTypeInfo = getFileTypeInformation(filePath);
    fs.rmSync(filePath);
    return fileTypeInfo;
  }
  return null;
}
