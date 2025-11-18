import { execSync } from 'child_process';
import fs from 'fs';
import YAML from 'yaml';

import {
  Argument,
  BasicType,
  ClassDeclaration,
  ConstantDeclaration,
  ConstructorDeclaration,
  DictionaryType,
  EnumType,
  Field,
  FileTypeInformation,
  FunctionDeclaration,
  ModuleClassDeclaration,
  ParametrizedType,
  PropDeclaration,
  RecordType,
  SumType,
  Type,
  TypeIdentifier,
  TypeKind,
  ViewDeclaration,
} from '../typeInformation';
import { FileType, Structure } from '../types';

/*
The Swift object type can have nested objects as the type of it's values (or maybe even keys).
[String: [String: Any]]

We can't use regex to find the root colon, so this is the safest way – by counting brackets.
*/
function findRootColonInDictionary(type: string) {
  let colonIndex = -1;
  let openBracketsCount = 0;
  for (let i = 0; i < type.length; i++) {
    if (type[i] === '[') {
      openBracketsCount++;
    } else if (type[i] === ']') {
      openBracketsCount--;

      // TODO check This should be openBracketsCount === 1 right ???
      // No, because this check is on inner type
    } else if (type[i] === ':' && openBracketsCount === 0) {
      colonIndex = i;
      break;
    }
  }
  return colonIndex;
}

function unwrapSwiftDictionary(type: string) {
  const innerType = type.substring(1, type.length - 1);
  const colonPosition = findRootColonInDictionary(innerType);
  return {
    key: innerType.slice(0, colonPosition).trim(),
    value: innerType.slice(colonPosition + 1).trim(),
  };
}

function isSwiftDictionary(type: string): boolean {
  return (
    type.startsWith('[') &&
    type.endsWith(']') &&
    findRootColonInDictionary(type.substring(1, type.length - 1)) >= 0
  );
}

/*
We receive types from SourceKitten and `getStructure` like so (examples):
[AcceptedTypes]?, UIColor?, [String: Any]

We need to parse them first to TS nodes in `mapSwiftTypeToTsType` with the following helper functions.
*/

function isSwiftArray(type: string) {
  // This can also be an object, but we check that first, so if it's not an object and is wrapped with [] it's an array.
  return type.startsWith('[') && type.endsWith(']');
}

function unwrapSwiftArray(type: string): Type {
  const innerType = type.substring(1, type.length - 1);
  return mapSwiftTypeToTsType(innerType.trim());
}

function isSwiftOptional(type: string): boolean {
  return type.endsWith('?');
}

function isParametrizedType(type: string): boolean {
  return type.endsWith('>');
}

function unwrapParametrizedType(type: string): ParametrizedType {
  let openBracketCount = 0;
  let start = 0;
  const innerTypes: Type[] = [];
  let name: string = '';
  for (let i = 0; i < type.length; i += 1) {
    if (type[i] === '<') {
      openBracketCount += 1;
      if (openBracketCount === 1) {
        name = type.substring(0, i);
        start = i + 1;
      }
    } else if (type[i] === '>') {
      openBracketCount -= 1;
      if (openBracketCount === 0) {
        innerTypes.push(mapSwiftTypeToTsType(type.substring(start, i).trim()));
        start = i + 1;
      }
    } else if (type[i] === ',' && openBracketCount === 1) {
      innerTypes.push(mapSwiftTypeToTsType(type.substring(start, i).trim()));
      start = i + 1;
    }
  }
  return { name, types: innerTypes };
}

function isEitherTypeIdentifier(typeIdentifier: string): boolean {
  return (
    typeIdentifier === 'Either' ||
    typeIdentifier === 'EitherOfThree' ||
    typeIdentifier === 'EitherOfFour'
  );
}

function mapSwiftTypeToTsType(type?: string): Type {
  if (!type) {
    return { kind: TypeKind.IDENTIFIER, type: 'any' };
  }
  if (isSwiftOptional(type)) {
    return { kind: TypeKind.OPTIONAL, type: mapSwiftTypeToTsType(type.slice(0, -1).trim()) };
  }
  if (isSwiftDictionary(type)) {
    const { key, value } = unwrapSwiftDictionary(type);
    const keyType = mapSwiftTypeToTsType(key);
    const valueType = mapSwiftTypeToTsType(value);

    return {
      kind: TypeKind.DICTIONARY,
      type: {
        key: keyType,
        value: valueType,
      },
    };
  }
  if (isSwiftArray(type)) {
    return {
      kind: TypeKind.ARRAY,
      type: unwrapSwiftArray(type),
    };
  }
  if (isParametrizedType(type)) {
    const parametrizedType = unwrapParametrizedType(type);
    if (isEitherTypeIdentifier(parametrizedType.name)) {
      return {
        kind: TypeKind.SUM,
        type: parametrizedType as SumType,
      };
    }
    return {
      kind: TypeKind.PARAMETRIZED,
      type: parametrizedType,
    };
  }

  const returnType: Type = {
    kind: TypeKind.BASIC,
    type: BasicType.ANY,
  };

  switch (type) {
    case 'unknown':
    case 'Any':
      returnType.type = BasicType.ANY;
      break;
    case 'String':
      returnType.type = BasicType.STRING;
      break;
    case 'Bool':
      returnType.type = BasicType.BOOLEAN;
      break;
    case 'Int':
    case 'Float':
    case 'Double':
      returnType.type = BasicType.NUMBER;
      break;
    case 'Void':
      returnType.type = BasicType.VOID;
      break;
    default:
      returnType.kind = TypeKind.IDENTIFIER;
      returnType.type = type;
  }
  return returnType;
}

function getStructureFromFile(file: FileType) {
  const command = 'sourcekitten structure --file ' + file.path;

  try {
    const output = execSync(command);
    return JSON.parse(output.toString());
  } catch (error) {
    console.error('An error occurred while executing the command:', error);
  }
}

function isEnumStructure(structure: Structure): boolean {
  return structure['key.kind'] === 'source.lang.swift.decl.enum';
}

function isRecordStructure(structure: Structure): boolean {
  return (
    structure['key.kind'] === 'source.lang.swift.decl.struct' &&
    structure['key.inheritedtypes'] &&
    structure['key.inheritedtypes'].find((type) => {
      return type['key.name'] === 'Record';
    }) !== undefined
  );
}

function isModuleStructure(structure: Structure): boolean {
  return structure['key.typename'] === 'ModuleDefinition';
}

function parseStructure(
  structure: Structure,
  name: string,
  modulesStructures: { structure: Structure; name: string }[],
  recordsStructures: Structure[],
  enumsStructures: Structure[]
) {
  const substructure = structure['key.substructure'];

  if (isModuleStructure(structure)) {
    modulesStructures.push({ structure, name });
  } else if (isRecordStructure(structure)) {
    recordsStructures.push(structure);
  } else if (isEnumStructure(structure)) {
    enumsStructures.push(structure);
  } else if (Array.isArray(substructure) && substructure.length > 0) {
    for (const substructure of structure['key.substructure']) {
      parseStructure(
        substructure,
        structure['key.name'] ?? name,
        modulesStructures,
        recordsStructures,
        enumsStructures
      );
    }
  }
}

// Read string straight from file – needed since we can't get cursorinfo for modulename
function getIdentifierFromOffsetObject(offsetObject: Structure, file: FileType) {
  // adding 1 and removing 1 to get rid of quotes
  return file.content
    .substring(offsetObject['key.offset'], offsetObject['key.offset'] + offsetObject['key.length'])
    .replaceAll('"', '');
}

function hasSubstructure(structureObject: Structure) {
  return structureObject?.['key.substructure'] && structureObject['key.substructure'].length > 0;
}

function parseClosureTypes(structureObject: Structure) {
  const closure = structureObject['key.substructure']?.find(
    (s) => s['key.kind'] === 'source.lang.swift.expr.closure'
  );
  if (!closure) {
    return null;
  }
  const parameters = closure['key.substructure']
    ?.filter((s) => s['key.kind'] === 'source.lang.swift.decl.var.parameter')
    .map((p) => ({ name: p['key.name'], typename: p['key.typename'] }));

  const returnType = closure?.['key.typename'] ?? 'unknown';
  return { parameters, returnType };
}

let cachedSDKPath: string | null = null;
function getSDKPath(): string {
  if (cachedSDKPath) {
    return cachedSDKPath;
  }
  const sdkPath = execSync('xcrun --sdk iphoneos --show-sdk-path').toString().trim() as string;
  cachedSDKPath = sdkPath;
  return cachedSDKPath;
}

// Read type description with sourcekitten, works only for variables
function getTypeOfByteOffsetVariable(byteOffset: number, file: FileType): string | null {
  const request = {
    'key.request': 'source.request.cursorinfo',
    'key.sourcefile': file.path,
    'key.offset': byteOffset,
    'key.compilerargs': [file.path, '-target', 'arm64-apple-ios7', '-sdk', getSDKPath()],
  };
  const yamlRequest = YAML.stringify(request, {
    defaultStringType: 'QUOTE_DOUBLE',
    lineWidth: 0,
    defaultKeyType: 'PLAIN',
    // needed since behaviour of sourcekitten is not consistent
  } as any)
    .replace('"source.request.cursorinfo"', 'source.request.cursorinfo')
    .replaceAll('"', '\\"');

  const command = 'sourcekitten request --yaml "' + yamlRequest + '"';
  try {
    const output = JSON.parse(execSync(command, { stdio: 'pipe' }).toString());
    const inferredType = output['key.typename'];
    if (inferredType === '<<error type>>') {
      return null;
    }
    return inferredType;
  } catch (error) {
    console.error('An error occurred while executing the command:', error);
  }
  return null;
}

function mapParameterToType(parameter: { name: string; typename: string }): {
  name: string;
  type: Type;
} {
  return {
    name: parameter.name,
    type: mapSwiftTypeToTsType(parameter.typename),
  };
}

function parseModuleConstructorDeclaration(
  substructure: Structure,
  file: FileType
): ConstructorDeclaration {
  const definitionParams = substructure['key.substructure'];
  let types = null;

  // TODO rethink this maybe split based on what closure is expected
  // Maybe this should be the last substructure
  if (hasSubstructure(definitionParams[1])) {
    types = parseClosureTypes(definitionParams[1]);
  } else if (hasSubstructure(definitionParams[0])) {
    types = parseClosureTypes(definitionParams[0]);
  } else {
    // TODO REDO THIS
    // types = getTypeOfByteOffsetVariable(definitionParams[1]['key.offset'], file);
  }

  return {
    arguments: types?.parameters.map(mapParameterToType) ?? [],
  };
}

function parseModuleConstantSubstructure(
  substructure: Structure,
  file: FileType
): ConstantDeclaration {
  const definitionParams = substructure['key.substructure'];
  const name = getIdentifierFromOffsetObject(definitionParams[0], file);
  let types = null;
  if (hasSubstructure(definitionParams[1])) {
    types = parseClosureTypes(definitionParams[1]);
  } else {
    // TODO REDO THIS
    // types = getTypeOfByteOffsetVariable(definitionParams[1]['key.offset'], file);
  }

  return {
    name,
    type: mapSwiftTypeToTsType(types?.returnType),
  };
}

function parseModuleClassSubstructure(substructure: Structure, file: FileType): ClassDeclaration {
  const nestedModuleStructure =
    substructure['key.substructure']?.[1]?.['key.substructure']?.[0]?.['key.substructure']?.[0]?.[
      'key.substructure'
    ];

  const name = getIdentifierFromOffsetObject(substructure['key.substructure']?.[0], file).replace(
    '.self',
    ''
  );

  if (!nestedModuleStructure) {
    console.warn(name + " class is empty or couldn't parse its definition!");
    return {
      name,
      constructor: null,
      methods: [],
      asyncMethods: [],
      properties: [],
    };
  }

  const classTypeInfo = parseModuleStructure(
    nestedModuleStructure,
    file,
    'GREPME Does Not Matter :)'
  );
  return {
    name,
    methods: classTypeInfo.functions,
    asyncMethods: classTypeInfo.asyncFunctions,
    properties: classTypeInfo.properties,
    constructor: classTypeInfo.constructor,
  };
}

function parseModuleFunctionSubstructure(
  substructure: Structure,
  file: FileType
): FunctionDeclaration {
  const definitionParams = substructure['key.substructure'];
  const name = getIdentifierFromOffsetObject(definitionParams[0], file);
  let types = null;
  if (hasSubstructure(definitionParams[1])) {
    types = parseClosureTypes(definitionParams[1]);
  } else {
    // TODO REDO THIS
    // types = getTypeOfByteOffsetVariable(definitionParams[1]['key.offset'], file);
  }

  return {
    name,
    returnType: mapSwiftTypeToTsType(types?.returnType), // any or void ? Probably any
    parameters: [], // TODO Module function is not generic. I think so. Check it
    arguments: types?.parameters?.map(mapParameterToType) ?? [],
  };
}

const parseModulePropertySubstructure = parseModuleConstantSubstructure;

function parseModulePropDeclaration(substructure: Structure, file: FileType): PropDeclaration {
  const definitionParams = substructure['key.substructure'];
  const name = getIdentifierFromOffsetObject(definitionParams[0], file);
  let types = null;
  if (hasSubstructure(definitionParams[1])) {
    types = parseClosureTypes(definitionParams[1]);
  } else {
    // TODO REDO THIS
    // types = getTypeOfByteOffsetVariable(definitionParams[1]['key.offset'], file);
  }

  return {
    name,
    arguments: types?.parameters?.map(mapParameterToType) ?? [],
  };
}

function parseModuleViewDeclaration(substructure: Structure, file: FileType): ViewDeclaration {
  // The View arguments is a.self for some class a we want.
  const suffixLength = 5;
  const name = getIdentifierFromOffsetObject(substructure['key.substructure']?.[0], file).slice(
    0,
    -suffixLength
  );

  return parseModuleStructure(
    substructure['key.substructure'][1]['key.substructure'][0]['key.substructure'][0][
      'key.substructure'
    ],
    file,
    name
  );
}

function parseModuleEventDeclaration(structure: Structure, file: FileType, events: string[]): void {
  if (!structure) {
    return;
  }

  return structure['key.substructure'].forEach((substructure) =>
    events.push(getIdentifierFromOffsetObject(substructure, file))
  );
}

function extractDeclarationType(structure: Structure, file: FileType): Type {
  if (structure['key.typename']) {
    return mapSwiftTypeToTsType(structure['key.typename'] as string);
  }
  const inferReturn = getTypeOfByteOffsetVariable(structure['key.nameoffset'], file);
  return mapSwiftTypeToTsType(inferReturn ?? 'Any');
}

function parseRecordStructure(
  recordStructure: Structure,
  usedTypeIdentifiers: Set<string>,
  typeParametersCount: Map<string, number>,
  file: FileType
): RecordType {
  const fields: Field[] = [];

  for (const substructure of recordStructure['key.substructure']) {
    if (substructure['key.kind'] === 'source.lang.swift.decl.var.instance') {
      const type: Type = extractDeclarationType(substructure, file);
      fields.push({
        name: substructure['key.name'],
        type,
      });
      collectTypeIdentifiers(type, usedTypeIdentifiers, typeParametersCount);
    }
  }

  return {
    name: recordStructure['key.name'],
    fields,
  };
}

function parseEnumStructure(enumStructure: Structure): EnumType {
  const enumcases: string[] = [];
  for (const substructure of enumStructure['key.substructure']) {
    if (substructure['key.kind'] === 'source.lang.swift.decl.enumcase') {
      for (const caseSubstructure of substructure['key.substructure']) {
        // enum case in Swift can have values: case somecase(Int, String)
        // for now we ignore these values
        enumcases.push(caseSubstructure['key.name'].split('(', 1)[0]);
      }
    }
  }

  return {
    name: enumStructure['key.name'],
    cases: enumcases,
  };
}

function parseModuleStructure(
  moduleStructure: Structure[],
  file: FileType,
  name: string
): ModuleClassDeclaration {
  const mcd: ModuleClassDeclaration = {
    name,
    constants: [],
    constructor: null,
    functions: [],
    asyncFunctions: [],
    classes: [],
    properties: [],
    props: [],
    views: [],
    events: [],
  };

  for (const md of moduleStructure) {
    switch (md['key.name']) {
      case 'Name':
        mcd.name = getIdentifierFromOffsetObject(md['key.substructure']?.[0], file);
        break;
      case 'Function':
        mcd.functions.push(parseModuleFunctionSubstructure(md, file));
        break;
      case 'Constant':
        mcd.constants.push(parseModuleConstantSubstructure(md, file));
        break;
      case 'Class':
        mcd.classes.push(parseModuleClassSubstructure(md, file));
        break;
      case 'Property':
        mcd.properties.push(parseModulePropertySubstructure(md, file));
        break;
      case 'AsyncFunction':
        mcd.asyncFunctions.push(parseModuleFunctionSubstructure(md, file));
        break;
      case 'Constructor':
        mcd.constructor = parseModuleConstructorDeclaration(md, file);
        break;
      case 'Prop':
        mcd.props.push(parseModulePropDeclaration(md, file));
        break;
      case 'View':
        mcd.views.push(parseModuleViewDeclaration(md, file));
        break;
      case 'Events':
        parseModuleEventDeclaration(md, file, mcd.events);
        break;
      default:
        console.warn('Module substructure not supported');
    }
  }

  return mcd;
}

function collectTypeIdentifiers(
  type: Type,
  typeIdentiers: Set<string>,
  typeParametersCount: Map<string, number>
) {
  switch (type.kind) {
    case TypeKind.ARRAY:
    case TypeKind.OPTIONAL:
      collectTypeIdentifiers(type.type as Type, typeIdentiers, typeParametersCount);
      break;
    case TypeKind.DICTIONARY:
      collectTypeIdentifiers((type.type as DictionaryType).key, typeIdentiers, typeParametersCount);
      collectTypeIdentifiers(
        (type.type as DictionaryType).value,
        typeIdentiers,
        typeParametersCount
      );
      break;
    case TypeKind.SUM:
      for (const t of (type.type as SumType).types) {
        collectTypeIdentifiers(t, typeIdentiers, typeParametersCount);
      }
      break;
    case TypeKind.BASIC:
      // typeIdentiers.add('BASIC: ' + (type.type as BasicType).toString());
      break;
    case TypeKind.IDENTIFIER:
      typeIdentiers.add(type.type as TypeIdentifier);
      break;
    case TypeKind.PARAMETRIZED:
      const parametrizedType: ParametrizedType = type.type as ParametrizedType;
      const typename = parametrizedType.name;
      typeIdentiers.add(typename);
      typeParametersCount.set(
        typename,
        Math.max(typeParametersCount.get(typename) ?? 0, parametrizedType.types.length)
      );
      for (const t of (type.type as ParametrizedType).types) {
        collectTypeIdentifiers(t, typeIdentiers, typeParametersCount);
      }
      break;
  }
}

function collectModuleTypeIdentifiers(
  moduleClassDeclaration: ModuleClassDeclaration,
  fileTypeInformation: FileTypeInformation
) {
  const collect = (type: Type) => {
    collectTypeIdentifiers(
      type,
      fileTypeInformation.usedTypeIdentifiers,
      fileTypeInformation.typeParametersCount
    );
  };
  const collectArg = (arg: Argument) => {
    collect(arg.type);
  };
  const collectFunction = (functionDeclaration: FunctionDeclaration) => {
    collect(functionDeclaration.returnType);
    functionDeclaration.arguments.forEach(collectArg);
    functionDeclaration.parameters.forEach(collect);
  };
  moduleClassDeclaration.asyncFunctions.forEach(collectFunction);
  moduleClassDeclaration.functions.forEach(collectFunction);
  moduleClassDeclaration.constants.forEach(collectArg);
  moduleClassDeclaration.properties.forEach(collectArg);
  moduleClassDeclaration.constructor?.arguments.forEach(collectArg);
  moduleClassDeclaration.views.forEach((v) => collectModuleTypeIdentifiers(v, fileTypeInformation));
  moduleClassDeclaration.props.forEach((p) => p.arguments.forEach(collectArg));
  moduleClassDeclaration.classes.forEach((c) => {
    fileTypeInformation.declaredTypeIdentifiers.add(c.name);
    c.asyncMethods.forEach(collectFunction);
    c.methods.forEach(collectFunction);
    c.constructor?.arguments.forEach(collectArg);
    c.properties.forEach(collectArg);
  });
}

export function getSwiftFileTypeInformation(filePath: string): FileTypeInformation | null {
  const file = { path: filePath, content: fs.readFileSync(filePath, 'utf8') };

  const modulesStructures: { name: string; structure: Structure }[] = [];
  const recordsStructures: Structure[] = [];
  const enumsStructures: Structure[] = [];
  parseStructure(
    getStructureFromFile(file),
    '',
    modulesStructures,
    recordsStructures,
    enumsStructures
  );

  const typeParametersCount: Map<string, number> = new Map<string, number>();
  const moduleClasses: ModuleClassDeclaration[] = [];
  const moduleTypeIdentifiers: Set<string> = new Set<string>();
  const declaredTypeIdentifiers: Set<string> = new Set<string>();
  const recordTypeIdentifiers: Set<string> = new Set<string>();

  const enums: EnumType[] = enumsStructures.map(parseEnumStructure);
  const recordMap = (rd: Structure) =>
    parseRecordStructure(rd, recordTypeIdentifiers, typeParametersCount, file);
  const records = recordsStructures.map(recordMap);

  const fileTypeInformation = {
    moduleClasses,
    records,
    enums,
    functions: [],
    usedTypeIdentifiers: moduleTypeIdentifiers.union(recordTypeIdentifiers),
    declaredTypeIdentifiers,
    typeParametersCount,
  };

  enums.forEach(({ name }) => {
    declaredTypeIdentifiers.add(name);
  });
  records.forEach(({ name }) => {
    declaredTypeIdentifiers.add(name);
  });

  for (const { structure, name } of modulesStructures) {
    if (!structure['key.substructure']) {
      continue;
    }
    const moduleClassDeclaration = parseModuleStructure(structure['key.substructure'], file, name);
    moduleClasses.push(moduleClassDeclaration);
    collectModuleTypeIdentifiers(moduleClassDeclaration, fileTypeInformation);
  }

  return fileTypeInformation;
}
