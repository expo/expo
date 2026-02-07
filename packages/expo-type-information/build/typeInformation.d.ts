export declare enum IdentifierKind {
    BASIC = 0,
    ENUM = 1,
    RECORD = 2,
    CLASS = 3
}
export type ParametrizedType = {
    name: TypeIdentifier;
    types: Type[];
};
export type Argument = {
    name: string | undefined;
    type: Type;
};
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
export type DictionaryType = {
    key: Type;
    value: Type;
};
export type OptionalType = Type;
export type ArrayType = Type;
export type TypeIdentifier = string;
export type AnonymousType = ParametrizedType | SumType | OptionalType | DictionaryType | ArrayType;
export declare enum TypeKind {
    BASIC = 0,
    IDENTIFIER = 1,
    SUM = 2,
    PARAMETRIZED = 3,
    OPTIONAL = 4,
    ARRAY = 5,
    DICTIONARY = 6
}
export declare enum BasicType {
    ANY = 0,
    STRING = 1,
    NUMBER = 2,
    BOOLEAN = 3,
    VOID = 4,
    UNDEFINED = 5,
    UNRESOLVED = 6
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
export type TypeIdentifierDefinitionMap = Map<string, {
    kind: IdentifierKind;
    definition: string | RecordType | EnumType | ClassDeclaration;
}>;
export type TypeIdentifierDefinitionList = [
    string,
    {
        kind: IdentifierKind;
        definition: string | RecordType | EnumType | ClassDeclaration;
    }
][];
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
 * @param param0 FileTypeInformation object to serialize.
 * @returns FileTypeInformationSerialized object.
 */
export declare function serializeTypeInformation({ usedTypeIdentifiers, declaredTypeIdentifiers, inferredTypeParametersCount, typeIdentifierDefinitionMap, moduleClasses, records, enums, }: FileTypeInformation): FileTypeInformationSerialized;
/**
 * Used for testing purposes, maps Arrays to Sets and Maps depending on the field and returns FileTypeInformation object.
 * @param param0 FileTypeInformationSerialized object to deserialize.
 * @returns FileTypeInformation object.
 */
export declare function deserializeTypeInformation({ usedTypeIdentifiersList, declaredTypeIdentifiersList, inferredTypeParametersCountList, typeIdentifierDefinitionList, moduleClasses, records, enums, }: FileTypeInformationSerialized): FileTypeInformation;
/**
 * This function reads and extracts FileTypeInformation from a given file.
 * @param absoluteFilePath Absolute path to a Swift/Kotlin file.
 * @param preprocessFile If this flag is set to true and Swift file is provided, then the file is preprocessed so that more type information can be inferred.
 *  For now this option is slow so it's not enabled by default.
 * @returns FileTypeInformation object if the file provided was .swift file and it was parsed successfully. Otherwise it returns null.
 */
export declare function getFileTypeInformation(absoluteFilePath: string, preprocessFile?: boolean): FileTypeInformation | null;
/**
 * This function creates a temporary file with the provided content and extracts FileTypeInformation from it.
 * @param content Swift code.
 * @param language For now only Swift is supported.
 * @param preprocessFile If this flag is set to true and Swift file is provided, then the file is preprocessed so that more type information can be inferred.
 *  For now this option is slow so it's not enabled by default.
 * @returns FileTypeInformation object if the content provided was Swift and was parsed successfully. Otherwise it returns null.
 */
export declare function getFileTypeInformationForString(content: string, language: 'Swift', preprocessFile?: boolean): FileTypeInformation | null;
//# sourceMappingURL=typeInformation.d.ts.map