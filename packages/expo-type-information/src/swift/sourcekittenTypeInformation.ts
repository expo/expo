import { execSync, exec } from 'child_process';
import fs from 'fs';
import YAML from 'yaml';
import { promisify } from 'util';

const execAsync = promisify(exec);

import {
  Argument,
  BasicType,
  ClassDeclaration,
  ConstantDeclaration,
  ConstructorDeclaration,
  DefinitionOffset,
  DictionaryType,
  EnumType,
  Field,
  FileTypeInformation,
  FunctionDeclaration,
  IdentifierKind,
  ModuleClassDeclaration,
  ParametrizedType,
  PropDeclaration,
  RecordType,
  SumType,
  Type,
  TypeIdentifier,
  TypeIdentifierDefinitionMap,
  TypeKind,
  ViewDeclaration,
} from '../typeInformation';
import { Attribute, FileType, Structure } from '../types';

// TODO maybe take the taskAll from cli?
export const taskAll = <T, R>(
  inputs: T[],
  map: (input: T, index: number) => Promise<R>
): Promise<R[]> => {
  return Promise.all(inputs.map(map));
};

function isSwiftDictionary(type: string): boolean {
  return (
    type.startsWith('[') &&
    type.endsWith(']') &&
    findRootColonInDictionary(type.substring(1, type.length - 1)) >= 0
  );
}

function isSwiftArray(type: string) {
  // This can also be an object, but we check that first, so if it's not an object and is wrapped with [] it's an array.
  return type.startsWith('[') && type.endsWith(']');
}

function isSwiftOptional(type: string): boolean {
  return type.endsWith('?');
}

function isParametrizedType(type: string): boolean {
  return type.endsWith('>');
}

function isEitherTypeIdentifier(typeIdentifier: string): boolean {
  return (
    typeIdentifier === 'Either' ||
    typeIdentifier === 'EitherOfThree' ||
    typeIdentifier === 'EitherOfFour'
  );
}

function isEnumStructure(structure: Structure): boolean {
  return structure['key.kind'] === 'source.lang.swift.decl.enum';
}

function isRecordStructure(structure: Structure): boolean {
  return (
    (structure['key.kind'] === 'source.lang.swift.decl.struct' ||
      structure['key.kind'] === 'source.lang.swift.decl.class') &&
    structure['key.inheritedtypes'] &&
    structure['key.inheritedtypes'].find((type) => {
      return type['key.name'] === 'Record';
    }) !== undefined
  );
}

function isModuleStructure(structure: Structure): boolean {
  return structure['key.typename'] === 'ModuleDefinition';
}

function unwrapSwiftArray(type: string): Type {
  const innerType = type.substring(1, type.length - 1);
  return mapSwiftTypeToTsType(innerType.trim());
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

function unwrapSwiftDictionary(type: string) {
  const innerType = type.substring(1, type.length - 1);
  const colonPosition = findRootColonInDictionary(innerType);
  return {
    key: innerType.slice(0, colonPosition).trim(),
    value: innerType.slice(colonPosition + 1).trim(),
  };
}

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
    } else if (type[i] === ':' && openBracketsCount === 0) {
      colonIndex = i;
      break;
    }
  }
  return colonIndex;
}

function mapSwiftTypeToTsType(type?: string): Type {
  if (!type) {
    return { kind: TypeKind.BASIC, type: BasicType.UNRESOLVED };
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

// Read string straight from file – needed since we can't get cursorinfo for modulename
function getIdentifierFromOffsetObject(offsetObject: Structure, file: FileType) {
  // adding 1 and removing 1 to get rid of quotes
  return file.content
    .substring(offsetObject['key.offset'], offsetObject['key.offset'] + offsetObject['key.length'])
    .replaceAll('"', '');
}

function hasSubstructure(structure: Structure) {
  return structure?.['key.substructure'] && structure['key.substructure'].length > 0;
}

async function findReturnType(structure: Structure, file: FileType): Promise<string | null> {
  if (
    structure['key.kind'] === 'source.lang.swift.decl.var.local' &&
    structure['key.name'].startsWith('returnValueDeclaration_')
  ) {
    // TODO this return type inference is really costly
    return getTypeOfByteOffsetVariable(structure['key.nameoffset'], file);
  }
  if (hasSubstructure(structure)) {
    for (const substructure of structure['key.substructure']) {
      const returnType = findReturnType(substructure, file);
      if (returnType) {
        return returnType;
      }
    }
  }
  return null;
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

async function extractDeclarationType(structure: Structure, file: FileType): Promise<Type> {
  if (structure['key.typename']) {
    return mapSwiftTypeToTsType(structure['key.typename'] as string);
  }
  // TODO this type inference is really costly
  const inferReturn = await getTypeOfByteOffsetVariable(structure['key.nameoffset'], file);
  return mapSwiftTypeToTsType(inferReturn ?? 'Any');
}

// Read type description with sourcekitten, works only for variables
// TODO This function is extremely slow and inefficient
// consider other options
async function getTypeOfByteOffsetVariable(
  byteOffset: number,
  file: FileType
): Promise<string | null> {
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
    const { stdout } = await execAsync(command);
    const output = JSON.parse(stdout.toString());
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

function mapSourcekittenParameterToType(parameter: {
  name: string | undefined;
  typename: string;
}): Argument {
  return {
    name: parameter.name ?? undefined,
    type: mapSwiftTypeToTsType(parameter.typename),
  };
}

const parseModulePropertySubstructure = parseModuleConstantSubstructure;

async function parseClosureTypes(
  structure: Structure,
  file: FileType
): Promise<{ parameters: { name: string; typename: string }[]; returnType: string | null }> {
  const closure = structure['key.substructure']?.find(
    (s) => s['key.kind'] === 'source.lang.swift.expr.closure'
  );
  if (!closure) {
    // Try finding the preprocessed return value, if not found we don't know the return type
    const returnType = await findReturnType(structure, file);
    return { parameters: [], returnType };
  }
  const parameters = closure['key.substructure']
    ?.filter((s) => s['key.kind'] === 'source.lang.swift.decl.var.parameter')
    .map((p) => ({
      name: p['key.name'] ?? undefined,
      typename: p['key.typename'],
    }));

  const returnType = closure?.['key.typename'] ?? (await findReturnType(structure, file));
  return { parameters, returnType };
}

async function parseModuleConstructorDeclaration(
  substructure: Structure,
  file: FileType
): Promise<ConstructorDeclaration> {
  const definitionParams = substructure['key.substructure'];
  let types = null;

  // TODO rethink this maybe split based on what closure is expected
  // Maybe this should be the last substructure
  if (definitionParams[1] && hasSubstructure(definitionParams[1])) {
    types = await parseClosureTypes(definitionParams[1], file);
  } else if (definitionParams[0] && hasSubstructure(definitionParams[0])) {
    types = await parseClosureTypes(definitionParams[0], file);
  } else {
    // TODO REDO THIS
    // types = getTypeOfByteOffsetVariable(definitionParams[1]['key.offset'], file);
  }

  return {
    arguments: types?.parameters.map(mapSourcekittenParameterToType) ?? [],
    definitionOffset: substructure['key.offset'],
  };
}

async function parseModuleConstantSubstructure(
  substructure: Structure,
  file: FileType
): Promise<ConstantDeclaration | null> {
  const definitionParams = substructure['key.substructure'];
  if (!definitionParams[0]) {
    return null;
  }
  const name = getIdentifierFromOffsetObject(definitionParams[0], file);
  let types = null;
  if (definitionParams[1] && hasSubstructure(definitionParams[1])) {
    types = await parseClosureTypes(definitionParams[1], file);
  } else {
    // TODO REDO THIS
    // types = getTypeOfByteOffsetVariable(definitionParams[1]['key.offset'], file);
  }

  return {
    name,
    type: mapSwiftTypeToTsType(types?.returnType ?? undefined),
    definitionOffset: substructure['key.offset'],
  };
}

async function parseModuleClassSubstructure(
  substructure: Structure,
  file: FileType
): Promise<ClassDeclaration> {
  const nestedModuleStructure =
    substructure['key.substructure']?.[1]?.['key.substructure']?.[0]?.['key.substructure']?.[0]?.[
      'key.substructure'
    ];

  const nameSubstrucutre = substructure['key.substructure']?.[0];
  const name = nameSubstrucutre
    ? getIdentifierFromOffsetObject(nameSubstrucutre, file).replace('.self', '')
    : 'UnnamedClass';

  if (!nestedModuleStructure) {
    console.warn(name + " class is empty or couldn't parse its definition!");
    return {
      name,
      constructor: null,
      methods: [],
      asyncMethods: [],
      properties: [],
      definitionOffset: substructure['key.offset'],
    };
  }

  const classTypeInfo = await parseModuleStructure(
    nestedModuleStructure,
    file,
    'GREPME Does Not Matter :)',
    substructure['key.offset']
  );
  return {
    name,
    methods: classTypeInfo.functions,
    asyncMethods: classTypeInfo.asyncFunctions,
    properties: classTypeInfo.properties,
    constructor: classTypeInfo.constructor,
    definitionOffset: substructure['key.offset'],
  };
}

async function parseModuleFunctionSubstructure(
  substructure: Structure,
  file: FileType
): Promise<FunctionDeclaration> {
  const definitionParams = substructure['key.substructure'];
  const nameSubstrucutre = definitionParams[0];
  const name = nameSubstrucutre
    ? getIdentifierFromOffsetObject(nameSubstrucutre, file)
    : 'UnnamedFunction';
  let types = null;
  if (definitionParams[1] && hasSubstructure(definitionParams[1])) {
    types = await parseClosureTypes(definitionParams[1], file);
  } else {
    // TODO REDO THIS
    // types = getTypeOfByteOffsetVariable(definitionParams[1]['key.offset'], file);
  }

  return {
    name,
    returnType: mapSwiftTypeToTsType(types?.returnType ?? undefined), // any or void ? Probably any
    parameters: [], // TODO Module function is not generic. I think so. Check it
    arguments: types?.parameters?.map(mapSourcekittenParameterToType) ?? [],
    definitionOffset: substructure['key.offset'],
  };
}

async function parseModulePropDeclaration(
  substructure: Structure,
  file: FileType
): Promise<PropDeclaration> {
  const definitionParams = substructure['key.substructure'];
  const nameSubstrucutre = definitionParams[0];
  const name = nameSubstrucutre
    ? getIdentifierFromOffsetObject(nameSubstrucutre, file)
    : 'UnkownProp';
  let types = null;
  if (definitionParams[1] && hasSubstructure(definitionParams[1])) {
    types = await parseClosureTypes(definitionParams[1], file);
  } else {
    // TODO REDO THIS
    // types = getTypeOfByteOffsetVariable(definitionParams[1]['key.offset'], file);
  }

  return {
    name,
    arguments: types?.parameters?.map(mapSourcekittenParameterToType) ?? [],
    definitionOffset: substructure['key.offset'],
  };
}

async function parseModuleViewDeclaration(
  substructure: Structure,
  file: FileType
): Promise<ViewDeclaration | null> {
  // The View arguments is a.self for some class a we want.
  const suffixLength = 5;
  const nameSubstrucutre = substructure['key.substructure']?.[0];
  if (!nameSubstrucutre) return null;
  const name = getIdentifierFromOffsetObject(nameSubstrucutre, file).slice(0, -suffixLength);

  const viewStructure =
    substructure?.['key.substructure']?.[1]?.['key.substructure']?.[0]?.['key.substructure']?.[0];
  const viewSubstructure = viewStructure?.['key.substructure'];
  if (!viewSubstructure) return null;
  return await parseModuleStructure(viewSubstructure, file, name, viewStructure['key.offset']);
}

function parseModuleEventDeclaration(structure: Structure, file: FileType, events: string[]): void {
  if (!structure) {
    return;
  }

  return structure['key.substructure'].forEach((substructure) =>
    events.push(getIdentifierFromOffsetObject(substructure, file))
  );
}

function hasFieldAttribute(attributes: Attribute[] | null, file: FileType): boolean {
  if (!attributes) {
    return false;
  }
  for (const attribute of attributes) {
    const attributeString = file.content.substring(
      attribute['key.offset'],
      attribute['key.offset'] + attribute['key.length']
    );
    if (attributeString === '@Field') {
      return true;
    }
  }
  return false;
}

async function parseRecordStructure(
  recordStructure: Structure,
  usedTypeIdentifiers: Set<string>,
  inferredTypeParametersCount: Map<string, number>,
  file: FileType
): Promise<RecordType> {
  const fields: Field[] = [];
  const recordSubstrucutres = recordStructure['key.substructure'].filter(
    (substructure) =>
      substructure['key.kind'] === 'source.lang.swift.decl.var.instance' &&
      hasFieldAttribute(substructure['key.attributes'], file)
  );

  const substructureTypeMap = (substructure: Structure) => {
    return extractDeclarationType(substructure, file).then((type) => {
      return { type, name: substructure['key.name'] };
    });
  };
  const recordElementTypes = await taskAll(recordSubstrucutres, substructureTypeMap);

  for (const { type, name } of recordElementTypes) {
    fields.push({ type, name });
    collectTypeIdentifiers(type, usedTypeIdentifiers, inferredTypeParametersCount);
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
        const caseName = caseSubstructure['key.name'].split('(', 1)[0];
        if (caseName) {
          enumcases.push(caseName);
        }
      }
    }
  }

  return {
    name: enumStructure['key.name'],
    cases: enumcases,
  };
}

function sortModuleClassDeclaration(moduleClassDeclaration: ModuleClassDeclaration) {
  const cmp = (obj0: DefinitionOffset, obj1: DefinitionOffset): number =>
    obj0.definitionOffset - obj1.definitionOffset;

  moduleClassDeclaration.asyncFunctions.sort(cmp);
  moduleClassDeclaration.classes.sort(cmp);
  moduleClassDeclaration.constants.sort(cmp);
  moduleClassDeclaration.events.sort();
  moduleClassDeclaration.functions.sort(cmp);
  moduleClassDeclaration.properties.sort(cmp);
  moduleClassDeclaration.props.sort(cmp);
  moduleClassDeclaration.views.sort(cmp);
}

async function parseModuleStructure(
  moduleStructure: Structure[],
  file: FileType,
  name: string,
  definitionOffset: number
): Promise<ModuleClassDeclaration> {
  const moduleClassDeclaration: ModuleClassDeclaration = {
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
    definitionOffset,
  };

  await taskAll(moduleStructure, async (structure, index) => {
    switch (structure['key.name']) {
      case 'Name':
        const nameSubstrucutre = structure['key.substructure']?.[0];
        if (nameSubstrucutre) {
          moduleClassDeclaration.name = getIdentifierFromOffsetObject(nameSubstrucutre, file);
        }
        break;
      case 'Function':
        moduleClassDeclaration.functions.push(
          await parseModuleFunctionSubstructure(structure, file)
        );
        break;
      case 'Constant':
        const constantDeclaration = await parseModuleConstantSubstructure(structure, file);
        if (constantDeclaration) {
          moduleClassDeclaration.constants.push(constantDeclaration);
        }
        break;
      case 'Class':
        moduleClassDeclaration.classes.push(await parseModuleClassSubstructure(structure, file));
        break;
      case 'Property':
        const propertyDeclaration = await parseModulePropertySubstructure(structure, file);
        if (propertyDeclaration) {
          moduleClassDeclaration.properties.push(propertyDeclaration);
        }
        break;
      case 'AsyncFunction':
        moduleClassDeclaration.asyncFunctions.push(
          await parseModuleFunctionSubstructure(structure, file)
        );
        break;
      case 'Constructor':
        moduleClassDeclaration.constructor = await parseModuleConstructorDeclaration(
          structure,
          file
        );
        break;
      case 'Prop':
        moduleClassDeclaration.props.push(await parseModulePropDeclaration(structure, file));
        break;
      case 'View':
        const viewDeclaration = await parseModuleViewDeclaration(structure, file);
        if (viewDeclaration) {
          moduleClassDeclaration.views.push(viewDeclaration);
        }
        break;
      case 'Events':
        parseModuleEventDeclaration(structure, file, moduleClassDeclaration.events);
        break;
      default:
        console.warn('Module substructure not supported');
    }
  });

  // As we parse the module structure concurrently the order of for example functions is nondeterministic.
  // We want to make it deterministic -- better for testing and usage.
  //
  // To make it deterministic a `definitionOffset` was added to each declaration.
  // We sort declaration by this `definitionOffset` which additionally preserves the in file ordering.
  //
  // This may not be as useful if we get to merging type informations from multiple files as the `definitionOffset` will not be comparable.
  sortModuleClassDeclaration(moduleClassDeclaration);
  return moduleClassDeclaration;
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

function getTypeIdentifierDefinitionMap(
  fileTypeInformation: FileTypeInformation
): Map<
  string,
  { kind: IdentifierKind; definition: string | RecordType | EnumType | ClassDeclaration }
> {
  const typeIdentifierDefinitionMap = new Map<
    string,
    { kind: IdentifierKind; definition: string | RecordType | EnumType | ClassDeclaration }
  >([]);

  fileTypeInformation.records.forEach((r) =>
    typeIdentifierDefinitionMap.set(r.name, { kind: IdentifierKind.RECORD, definition: r })
  );
  fileTypeInformation.enums.forEach((e) =>
    typeIdentifierDefinitionMap.set(e.name, { kind: IdentifierKind.ENUM, definition: e })
  );

  return typeIdentifierDefinitionMap;
}

function collectTypeIdentifiers(
  type: Type,
  typeIdentiers: Set<string>,
  inferredTypeParametersCount: Map<string, number>
) {
  switch (type.kind) {
    case TypeKind.ARRAY:
    case TypeKind.OPTIONAL:
      collectTypeIdentifiers(type.type as Type, typeIdentiers, inferredTypeParametersCount);
      break;
    case TypeKind.DICTIONARY:
      collectTypeIdentifiers(
        (type.type as DictionaryType).key,
        typeIdentiers,
        inferredTypeParametersCount
      );
      collectTypeIdentifiers(
        (type.type as DictionaryType).value,
        typeIdentiers,
        inferredTypeParametersCount
      );
      break;
    case TypeKind.SUM:
      for (const t of (type.type as SumType).types) {
        collectTypeIdentifiers(t, typeIdentiers, inferredTypeParametersCount);
      }
      break;
    case TypeKind.BASIC:
      // if ((type.type as BasicType) === BasicType.UNRESOLVED) {
      //   typeIdentiers.add('UnresolvedType');
      // }
      break;
    case TypeKind.IDENTIFIER:
      typeIdentiers.add(type.type as TypeIdentifier);
      break;
    case TypeKind.PARAMETRIZED: {
      const parametrizedType: ParametrizedType = type.type as ParametrizedType;
      const typename = parametrizedType.name;
      typeIdentiers.add(typename);
      inferredTypeParametersCount.set(
        typename,
        Math.max(inferredTypeParametersCount.get(typename) ?? 0, parametrizedType.types.length)
      );
      for (const t of (type.type as ParametrizedType).types) {
        collectTypeIdentifiers(t, typeIdentiers, inferredTypeParametersCount);
      }
      break;
    }
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
      fileTypeInformation.inferredTypeParametersCount
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

export async function getSwiftFileTypeInformation(
  filePath: string
): Promise<FileTypeInformation | null> {
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

  const inferredTypeParametersCount: Map<string, number> = new Map<string, number>();
  const moduleClasses: ModuleClassDeclaration[] = [];
  const moduleTypeIdentifiers: Set<string> = new Set<string>();
  const declaredTypeIdentifiers: Set<string> = new Set<string>();
  const recordTypeIdentifiers: Set<string> = new Set<string>();
  const typeIdentifierDefinitionMap: TypeIdentifierDefinitionMap = new Map();
  const enums: EnumType[] = enumsStructures.map(parseEnumStructure);
  const recordMap = (rd: Structure) => {
    return parseRecordStructure(rd, recordTypeIdentifiers, inferredTypeParametersCount, file);
  };

  const recordsPromise = taskAll(recordsStructures, recordMap);
  const moduleClassDeclarationsPromise = taskAll(
    modulesStructures.filter(({ structure }) => hasSubstructure(structure)),
    ({ structure, name }) =>
      parseModuleStructure(structure['key.substructure'], file, name, structure['key.offset'])
  );

  const [records, moduleClassDeclarations] = await Promise.all([
    recordsPromise,
    moduleClassDeclarationsPromise,
  ]);

  enums.forEach(({ name }) => {
    declaredTypeIdentifiers.add(name);
  });
  records.forEach(({ name }) => {
    declaredTypeIdentifiers.add(name);
  });

  const fileTypeInformation = {
    moduleClasses,
    records,
    enums,
    functions: [],
    usedTypeIdentifiers: moduleTypeIdentifiers.union(recordTypeIdentifiers),
    declaredTypeIdentifiers,
    inferredTypeParametersCount,
    typeIdentifierDefinitionMap,
  };

  for (const moduleClassDeclaration of moduleClassDeclarations) {
    moduleClasses.push(moduleClassDeclaration);
    collectModuleTypeIdentifiers(moduleClassDeclaration, fileTypeInformation);
  }

  fileTypeInformation.typeIdentifierDefinitionMap =
    getTypeIdentifierDefinitionMap(fileTypeInformation);

  return fileTypeInformation;
}

function removeComments(fileContent: string): string {
  let multiLineComment = false;
  let singleLineComment = false;
  const newFileContent: string[] = [];
  let start: number = 0;

  for (let i = 0; i < fileContent.length; i += 1) {
    const char = fileContent[i];
    const nextChar = i + 1 < fileContent.length ? fileContent[i + 1] : null;
    switch (char) {
      case '/': {
        if (nextChar === '/' && !multiLineComment) {
          singleLineComment = true;
          newFileContent.push(fileContent.substring(start, i));
        } else if (nextChar === '*' && !singleLineComment) {
          multiLineComment = true;
          newFileContent.push(fileContent.substring(start, i));
        }
        break;
      }
      case '*': {
        if (nextChar === '/' && multiLineComment) {
          start = i + 2;
          i += 1;
          multiLineComment = false;
        }
        break;
      }
      case '\n': {
        if (singleLineComment) {
          singleLineComment = false;
          start = i + 1;
        }
        break;
      }
    }
  }
  newFileContent.push(fileContent.substring(start, fileContent.length));
  return newFileContent.join('');
}

function returnExpressionEnd(fileContent: string, returnIndex: number): number {
  let inString = false;
  let escaped = false;
  let parenCount = 0;
  let braceCount = 0;
  // TODO figure out what also changes the typical end of expression

  let i = returnIndex;
  while (i < fileContent.length) {
    const char = fileContent[i];
    let escapedNow = false;
    switch (char) {
      case '(':
        parenCount += 1;
        break;
      case ')':
        parenCount -= 1;
        break;
      case '{':
        braceCount += 1;
        break;
      case '}':
        if (braceCount === 0) {
          return i;
        }
        braceCount -= 1;
        break;
      case '"':
        if (!escaped) {
          inString = !inString;
        }
        break;
      case ';':
        return i;
      case '\n':
      case '\r':
        if (!inString && parenCount === 0 && braceCount === 0) {
          return i;
        }
        break;
      case '\\':
        escapedNow = true;
    }
    escaped = escapedNow;
    i += 1;
  }
  return i;
}

// Preprocessing to help sourcekitten functions
// For now we create a new variable for each return statement,
// we can find it's type easily with sourcekitten
export function preprocessSwiftFile(originalFileContent: string): string {
  const newFileContent: string[] = [];
  const fileContent = removeComments(originalFileContent);
  const returnPositions: { start: number; end: number }[] = [];
  let startPos = 0;
  while (startPos < fileContent.length) {
    const returnIndex = fileContent.indexOf('return ', startPos);
    if (returnIndex < 0 || returnIndex >= fileContent.length) {
      break;
    }
    returnPositions.push({
      start: returnIndex,
      end: returnExpressionEnd(fileContent, returnIndex),
    });
    startPos = returnIndex + 1;
  }

  let prevEnd = 0;

  for (const { start, end } of returnPositions) {
    newFileContent.push(fileContent.substring(prevEnd, start));
    newFileContent.push(
      `let returnValueDeclaration_${start}_${end} = ${fileContent.substring(start + 6, end)}\n`
    );
    newFileContent.push(`return returnValueDeclaration_${start}_${end}\n`);
    prevEnd = end;
  }
  newFileContent.push(fileContent.substring(prevEnd, fileContent.length));
  return newFileContent.join('');
}
