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
    name: string;
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
    typeParametersCountList: [string, number][];
    typeIdentifierDefinitionList: TypeIdentifierDefinitionList;
    moduleClasses: ModuleClassDeclaration[];
    records: RecordType[];
    enums: EnumType[];
};
export type FileTypeInformation = {
    usedTypeIdentifiers: Set<string>;
    declaredTypeIdentifiers: Set<string>;
    typeParametersCount: Map<string, number>;
    typeIdentifierDefinitionMap: TypeIdentifierDefinitionMap;
    moduleClasses: ModuleClassDeclaration[];
    records: RecordType[];
    enums: EnumType[];
};
export declare function serializeTypeInformation({ usedTypeIdentifiers, declaredTypeIdentifiers, typeParametersCount, typeIdentifierDefinitionMap, moduleClasses, records, enums, }: FileTypeInformation): FileTypeInformationSerialized;
export declare function deserializeTypeInformation({ usedTypeIdentifiersList, declaredTypeIdentifiersList, typeParametersCountList, typeIdentifierDefinitionList, moduleClasses, records, enums, }: FileTypeInformationSerialized): FileTypeInformation;
export declare function getFileTypeInformation(absoluteFilePath: string, preprocessFile?: boolean): FileTypeInformation | null;
export declare function getFileTypeInformationForString(content: string, language: 'swift'): FileTypeInformation | null;
//# sourceMappingURL=typeInformation.d.ts.map