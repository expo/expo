import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import {
  getSwiftFileTypeInformation,
  preprocessSwiftFile,
} from './swift/sourcekittenTypeInformation';
import { taskAll } from './utils';

/**
 * Represents the kind of a parsed identifier from a native file.
 */
export enum IdentifierKind {
  BASIC,
  ENUM,
  RECORD,
  CLASS,
}

/**
 * Represents a parametrized type, that is a generic type with specified parameters e.g. Map<string, number>.
 */
export type ParametrizedType = {
  name: TypeIdentifier;
  types: Type[];
};

/**
 * Represents an argument passed to a function or constructor.
 */
export type Argument = { name: string | undefined; type: Type };

/**
 * Represents a single field within a record or a struct.
 */
export type Field = Argument;

/**
 * Represents a struct or dictionary-like record consisting of named fields.
 */
export type RecordType = {
  name: string;
  fields: Field[];
};

/**
 * Represents a single case inside an enum declaration.
 */
export type EnumCase = string;

/**
 * Represents an enum type, containing its name and all associated cases.
 */
export type EnumType = {
  name: string;
  cases: EnumCase[];
};

/**
 * Represents a union or a sum type where a value can be one of several different types.
 */
export type SumType = {
  types: Type[];
};

/**
 * Represents a dictionary type, defining the explicit types for its keys and values.
 */
export type DictionaryType = {
  key: Type;
  value: Type;
};

/**
 * Represents an optional type that can also resolve to null or undefined.
 * > **Note:** The information that this type is optional is implicit and exists only in the type system and on the parent type. There is no field on the `OptionalType` object that explicitly indicates that.
 */
export type OptionalType = Type;

/**
 * Represents a list or array of a specific type.
 * > **Note:** The information that this type is array is implicit and exists only in the type system and on the parent type. There is no field on the `ArrayType` object that explicitly indicates that.
 */
export type ArrayType = Type;

/**
 * Represents a type identifier as a string reference.
 */
export type TypeIdentifier = string;

/**
 * Represents an anonymous type, a one that is not named instead written directly in the code, such as inline generics, arrays, or optionals.
 */
export type AnonymousType = ParametrizedType | SumType | OptionalType | DictionaryType | ArrayType;

/**
 * Categorizes the type node within the abstract syntax tree.
 */
export enum TypeKind {
  BASIC,
  IDENTIFIER,
  SUM,
  PARAMETRIZED,
  OPTIONAL,
  ARRAY,
  DICTIONARY,
}

/**
 * Represents a basic type that is not user defined.
 */
export enum BasicType {
  ANY,
  STRING,
  NUMBER,
  BOOLEAN,
  VOID,
  UNDEFINED,
  /** Represents a type that couldn't be resolved */
  UNRESOLVED,
}

/**
 * Represents an abstract type node.
 */
export type Type = {
  kind: TypeKind;
  type: BasicType | TypeIdentifier | AnonymousType;
};

/**
 * Represents a DSL property declaration.
 */
export type PropertyDeclaration = ConstantDeclaration;

/**
 * Represents a DSL view declaration.
 */
export type ViewDeclaration = ModuleClassDeclaration;

/**
 * Represents a DSL event declaration.
 */
export type EventDeclaration = string;

/**
 * Retains information of where the thing was defined in the file.
 * As collecting type information is written in asynchronous way it is non-deterministic.
 * To make it deterministic we just sort the declaration by the definitionOffset, maintaining the same ordering as in original file.
 * @header TypeInfoTypes
 */
export type DefinitionOffset = {
  definitionOffset: number;
};

/**
 * Represents a DSL constant declaration.
 */
export type ConstantDeclaration = {
  name: string;
  type: Type;
} & DefinitionOffset;

/**
 * Represents a DSL function declaration.
 * @hideType
 */
export type FunctionDeclaration = {
  name: string;
  returnType: Type;
  arguments: Argument[];
  parameters: Type[];
} & DefinitionOffset;

/**
 * Represents a DSL prop declaration.
 */
export type PropDeclaration = {
  name: string;
  arguments: Argument[];
} & DefinitionOffset;

/**
 * Represents a DSL class constructor declaration.
 */
export type ConstructorDeclaration = {
  arguments: Argument[];
} & DefinitionOffset;

/**
 * Represents a DSL native class declaration.
 */
export type ClassDeclaration = {
  name: string;
  constructor: ConstructorDeclaration | null;
  methods: FunctionDeclaration[];
  asyncMethods: FunctionDeclaration[];
  properties: PropertyDeclaration[];
} & DefinitionOffset;

/**
 * Represents a DSL module declaration.
 */
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
} & DefinitionOffset;

/**
 * Represents a definition of an identifier.
 */
export type IdentifierDefinition = {
  kind: IdentifierKind;
  definition: string | RecordType | EnumType | ClassDeclaration;
};

/**
 * Maps type identifier strings to their definition objects.
 */
export type TypeIdentifierDefinitionMap = Map<string, IdentifierDefinition>;

/**
 * Serialized version of the `TypeIdentifierDefinitionMap`.
 */
export type TypeIdentifierDefinitionList = [string, IdentifierDefinition][];

/**
 * Serialized version of the `FileTypeInformation`, suitable for JSON storage or testing environments.
 */
export type FileTypeInformationSerialized = {
  usedTypeIdentifiersList: string[];
  declaredTypeIdentifiersList: string[];
  inferredTypeParametersCountList: [string, number][];
  typeIdentifierDefinitionList: TypeIdentifierDefinitionList;
  moduleClasses: ModuleClassDeclaration[];
  records: RecordType[];
  enums: EnumType[];
};

/**
 * FileTypeInformation object abstracts over type related information in a file.
 * The abstraction is closely related to Typescript and expo NativeModules (both to be independent of the actual native side
 * and to give accurate information about what and how we can use the given module).
 * @header TypeInfoTypes
 */
export type FileTypeInformation = {
  /**
   * @field Set of all type identifiers declared and used in the file.
   */
  usedTypeIdentifiers: Set<string>;
  /**
   * @field Set of all type identifiers declared in the file.
   */
  declaredTypeIdentifiers: Set<string>;
  /**
   * @field For parametrized types it is the maximum number of parameters this type is used with.
   * This map is useful if we want to infer how many parameters a type declared in other file has.
   *
   * For example if `Set<string>` exists in a file then inferredTypeParametersCount['Set'] == 1.
   * If `Map<number, string>` exists then inferredTypeParametersCount['Map'] == 2.
   * If you use both `SomeParametrizedType<Type1, Type2>` and `SomeParametrizedType<Type3>` then inferredTypeParametersCount['SomeParametrizedType'] == 2.
   */
  inferredTypeParametersCount: Map<string, number>;
  /**
   * @field Maps string identifier to the appropriate declaration object. For now only enum and records identifiers are mapped.
   */
  typeIdentifierDefinitionMap: TypeIdentifierDefinitionMap;
  /**
   * @field Array of all module classes declared in the given file.
   */
  moduleClasses: ModuleClassDeclaration[];
  /**
   * @field Array of all record classes declared in the given file.
   */
  records: RecordType[];
  /**
   * @field Array of all enums declared in the given file.
   */
  enums: EnumType[];
};

/**
 * Used for testing purposes, maps Sets and Maps to Arrays and returns FileTypeInformationSerialized object which can be written to a JSON.
 * @param fileTypeinformation `FileTypeInformation` object to serialize.
 * @returns a `FileTypeInformationSerialized` object.
 * @header TypeInformationAbstraction
 */
export function serializeTypeInformation({
  usedTypeIdentifiers,
  declaredTypeIdentifiers,
  inferredTypeParametersCount,
  typeIdentifierDefinitionMap,
  moduleClasses,
  records,
  enums,
}: FileTypeInformation): FileTypeInformationSerialized {
  return {
    usedTypeIdentifiersList: [...usedTypeIdentifiers.keys()].sort(),
    declaredTypeIdentifiersList: [...declaredTypeIdentifiers.keys()].sort(),
    inferredTypeParametersCountList: [...inferredTypeParametersCount.entries()].sort(),
    typeIdentifierDefinitionList: [...typeIdentifierDefinitionMap.entries()].sort(),
    moduleClasses,
    records,
    enums,
  };
}

/**
 *  * Used for testing purposes, maps Arrays to Sets and Maps depending on the field and returns FileTypeInformation object.
 * @param fileTypeinformationSerialized `FileTypeInformationSerialized` object to deserialize.
 * @returns `FileTypeInformation` object.
 * @header TypeInformationAbstraction
 */
export function deserializeTypeInformation({
  usedTypeIdentifiersList,
  declaredTypeIdentifiersList,
  inferredTypeParametersCountList,
  typeIdentifierDefinitionList,
  moduleClasses,
  records,
  enums,
}: FileTypeInformationSerialized): FileTypeInformation {
  return {
    usedTypeIdentifiers: new Set<string>(usedTypeIdentifiersList),
    declaredTypeIdentifiers: new Set<string>(declaredTypeIdentifiersList),
    inferredTypeParametersCount: new Map<string, number>(inferredTypeParametersCountList),
    typeIdentifierDefinitionMap: new Map(typeIdentifierDefinitionList),
    moduleClasses,
    records,
    enums,
  };
}

/**
 * Defines the level of type inference to apply when extracting type information.
 * > **Note:** In case where type inference is on, it may take more then twice the time to compute the type information.
 */
export enum TypeInferenceOption {
  /** No type inference will be performed. */
  NO_INFERENCE,
  /** Basic type inference will be applied. */
  SIMPLE_INFERENCE,
  /** Preprocesses the file by injecting returns to extract more type info from sourcekitten. */
  PREPROCESS_AND_INFERENCE,
}

/**
 * Defines an input option for extracting type information directly from a raw string of source code.
 */
export type StringInputOption = {
  type: 'string';
  fileContent: string;
  language: 'Swift';
};

/**
 * Defines an input option for extracting type information from a set of physical files.
 */
export type FileInputOption = {
  type: 'file';
  inputFileAbsolutePaths: string[];
};

/**
 * Options specifying the input source and inference level for retrieving type information.
 */
export type GetFileTypeInformationOptions = {
  /** The input source, provided either as a direct string or a file path. */
  input: StringInputOption | FileInputOption;
  /** The desired level of type inference. Defaults to PREPROCESS_AND_INFERENCE if omitted. */
  typeInference?: TypeInferenceOption;
};

async function mergeFileContents(absoluteFilePaths: string[]): Promise<string> {
  const filesContents = await taskAll(absoluteFilePaths, (filePath) =>
    fs.promises.readFile(filePath, 'utf-8')
  );
  return filesContents.join('');
}

async function withTempFile<T>(content: string, fn: (filePath: string) => Promise<T>): Promise<T> {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'type-gen-'));
  const filePath = path.join(tempDir, 'TypeInformationTemporaryFile.swift');

  try {
    await fs.promises.writeFile(filePath, content, 'utf8');
    return await fn(filePath);
  } finally {
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
}

/**
 * Reads and extracts `FileTypeInformation` from either a provided file path or a raw string of source code.
 * If a raw string is provided, or if the `PREPROCESS_AND_INFERENCE` inference option is selected,
 * the function will create a temporary file with the (optionally preprocessed) content to facilitate parsing.
 * @param options - Configuration object containing the input source (file or string) and the desired level of type inference.
 * @returns A promise that resolves to a `FileTypeInformation` object if the input was parsed successfully. Otherwise, it resolves to `null`.
 * @header TypeInformationAbstraction
 */
export async function getFileTypeInformation({
  input,
  typeInference,
}: GetFileTypeInformationOptions): Promise<FileTypeInformation | null> {
  const shouldPreprocessFile = typeInference === TypeInferenceOption.PREPROCESS_AND_INFERENCE;
  const typeInferenceOn = typeInference !== TypeInferenceOption.NO_INFERENCE;
  if (!shouldPreprocessFile && input.type === 'file' && input.inputFileAbsolutePaths.length === 0) {
    return getSwiftFileTypeInformation(input.inputFileAbsolutePaths[0] as string, {
      typeInference: typeInferenceOn,
    });
  }

  const fileContent =
    input.type === 'file'
      ? await mergeFileContents(input.inputFileAbsolutePaths)
      : input.fileContent;

  const preprocessedContent = shouldPreprocessFile ? preprocessSwiftFile(fileContent) : fileContent;

  return withTempFile(preprocessedContent, async (tempFilePath) => {
    return getSwiftFileTypeInformation(tempFilePath, {
      typeInference: typeInferenceOn,
    });
  });
}
