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
//   arguments: { name: string; type: Type }[];
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
  arguments: { name: string; type: Type }[];
  parameters: Type[];
};

export type PropDeclaration = {
  name: string;
  arguments: { name: string; type: Type }[];
};

export type ConstructorDeclaration = {
  arguments: { name: string; type: Type }[];
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
  functions: FunctionDeclaration[];
  moduleClasses: ModuleClassDeclaration[];
  records: RecordType[];
  enums: EnumType[];
};

export type FileTypeInformationSerialized = {
  usedTypeIdentifiersList: string[];
  declaredTypeIdentifiersList: string[];
  functions: FunctionDeclaration[];
  moduleClasses: ModuleClassDeclaration[];
  records: RecordType[];
  enums: EnumType[];
};

export function serializeTypeInformation({
  usedTypeIdentifiers,
  declaredTypeIdentifiers,
  functions,
  moduleClasses,
  records,
  enums,
}: FileTypeInformation): FileTypeInformationSerialized {
  return {
    usedTypeIdentifiersList: [...usedTypeIdentifiers],
    declaredTypeIdentifiersList: [...declaredTypeIdentifiers],
    functions,
    moduleClasses,
    records,
    enums,
  };
}

export function deserializeTypeInformation({
  usedTypeIdentifiersList,
  declaredTypeIdentifiersList,
  functions,
  moduleClasses,
  records,
  enums,
}: FileTypeInformationSerialized): FileTypeInformation {
  return {
    usedTypeIdentifiers: new Set<string>(usedTypeIdentifiersList),
    declaredTypeIdentifiers: new Set<string>(declaredTypeIdentifiersList),
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
