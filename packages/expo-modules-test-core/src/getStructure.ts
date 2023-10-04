// convert requires above to imports
import { execSync } from 'child_process';
import fsNode from 'fs';
import { globSync } from 'glob';
import XML from 'xml-js';
import YAML from 'yaml';

import {
  Closure,
  CursorInfoOutput,
  FileType,
  FullyAnnotatedDecl,
  OutputModuleDefinition,
  OutputViewDefinition,
  Structure,
} from './types';

const rootDir = process.cwd();
const pattern = `${rootDir}/**/*.swift`;

function getStructureFromFile(file: FileType) {
  const command = 'sourcekitten structure --file ' + file.path;

  try {
    const output = execSync(command);
    return JSON.parse(output.toString());
  } catch (error) {
    console.error('An error occurred while executing the command:', error);
  }
}
// find an object with "key.typename" : "ModuleDefinition" somewhere in the structure and return it
function findModuleDefinitionInStructure(structure: Structure): Structure[] | null {
  if (!structure) {
    return null;
  }
  if (structure?.['key.typename'] === 'ModuleDefinition') {
    const root = structure?.['key.substructure'];
    if (!root) {
      console.warn('Found ModuleDefinition but it is malformed');
    }
    return root;
  }
  const substructure = structure['key.substructure'];
  if (Array.isArray(substructure) && substructure.length > 0) {
    for (const child of substructure) {
      let result = null;
      result = findModuleDefinitionInStructure(child);
      if (result) {
        return result;
      }
    }
  }
  return null;
}

// Read string straight from file – needed since we can't get cursorinfo for modulename
function getIdentifierFromOffsetObject(offsetObject: Structure, file: FileType) {
  // adding 1 and removing 1 to get rid of quotes
  return file.content
    .substring(offsetObject['key.offset'], offsetObject['key.offset'] + offsetObject['key.length'])
    .replaceAll('"', '');
}

function maybeUnwrapXMLStructs(type: string | Partial<{ _text: string; 'ref.struct': string }>) {
  if (!type) {
    return type;
  }
  if (typeof type === 'string') {
    return type;
  }
  if (type['_text']) {
    return type['_text'];
  }
  if (type['ref.struct']) {
    return maybeUnwrapXMLStructs(type['ref.struct']);
  }
  return type;
}

function maybeWrapArray<T>(itemOrItems: T[] | T | null) {
  if (!itemOrItems) {
    return null;
  }
  if (Array.isArray(itemOrItems)) {
    return itemOrItems;
  } else {
    return [itemOrItems];
  }
}

function parseXMLAnnotatedDeclarations(cursorInfoOutput: CursorInfoOutput) {
  const xml = cursorInfoOutput['key.fully_annotated_decl'];
  if (!xml) {
    return null;
  }
  const parsed = XML.xml2js(xml, { compact: true }) as FullyAnnotatedDecl;

  const parameters =
    maybeWrapArray(parsed?.['decl.function.free']?.['decl.var.parameter'])?.map((p) => ({
      name: maybeUnwrapXMLStructs(p['decl.var.parameter.argument_label']),
      typename: maybeUnwrapXMLStructs(p['decl.var.parameter.type']),
    })) ?? [];
  const returnType = maybeUnwrapXMLStructs(
    parsed?.['decl.function.free']?.['decl.function.returntype']
  );
  return { parameters, returnType };
}

let cachedSDKPath: string | null = null;
function getSDKPath() {
  if (cachedSDKPath) {
    return cachedSDKPath;
  }
  const sdkPath = execSync('xcrun --sdk iphoneos --show-sdk-path').toString().trim();
  cachedSDKPath = sdkPath;
  return cachedSDKPath;
}

// Read type description with sourcekitten, works only for variables
function getTypeFromOffsetObject(offsetObject: Structure, file: FileType) {
  if (!offsetObject) {
    return null;
  }
  const request = {
    'key.request': 'source.request.cursorinfo',
    'key.sourcefile': file.path,
    'key.offset': offsetObject['key.offset'],
    'key.compilerargs': [file.path, '-target', 'arm64-apple-ios', '-sdk', getSDKPath()],
  };
  const yamlRequest = YAML.stringify(request, {
    defaultStringType: 'QUOTE_DOUBLE',
    lineWidth: 0,
    defaultKeyType: 'PLAIN',
    // needed since behaviour of sourcekitten is not consistent
  } as any).replace('"source.request.cursorinfo"', 'source.request.cursorinfo');

  const command = 'sourcekitten request --yaml "' + yamlRequest.replaceAll('"', '\\"') + '"';
  try {
    const output = execSync(command, { stdio: 'pipe' });
    return parseXMLAnnotatedDeclarations(JSON.parse(output.toString()));
  } catch (error) {
    console.error('An error occurred while executing the command:', error);
  }
  return null;
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

  // TODO: Figure out if possible
  const returnType = 'unknown';
  return { parameters, returnType };
}

// Used for functions,async functions, all of shape Identifier(name, closure or function)
function findNamedDefinitionsOfType(type: string, moduleDefinition: Structure[], file: FileType) {
  const definitionsOfType = moduleDefinition.filter((md) => md['key.name'] === type);
  return definitionsOfType.map((d) => {
    const definitionParams = d['key.substructure'];
    const name = getIdentifierFromOffsetObject(definitionParams[0], file);
    let types = null;
    if (hasSubstructure(definitionParams[1])) {
      types = parseClosureTypes(definitionParams[1]);
    } else {
      types = getTypeFromOffsetObject(definitionParams[1], file);
    }
    return { name, types };
  });
}

// Used for events
function findGroupedDefinitionsOfType(type: string, moduleDefinition: Structure[], file: FileType) {
  const definitionsOfType = moduleDefinition.filter((md) => md['key.name'] === type);
  return definitionsOfType.flatMap((d) => {
    const definitionParams = d['key.substructure'];
    return definitionParams.map((d) => ({ name: getIdentifierFromOffsetObject(d, file) }));
  });
}

function findAndParseView(
  moduleDefinition: Structure[],
  file: FileType
): null | OutputViewDefinition {
  const viewDefinition = moduleDefinition.find((md) => md['key.name'] === 'View');
  if (!viewDefinition) {
    return null;
  }
  // we support reading view definitions from closure only
  const viewModuleDefinition =
    viewDefinition['key.substructure']?.[1]?.['key.substructure']?.[0]?.['key.substructure']?.[0]?.[
      'key.substructure'
    ];
  if (!viewModuleDefinition) {
    console.warn('Could not parse view definition');
    return null;
  }
  // let's drop nested view field (is null anyways)
  const { view: _, ...definition } = parseModuleDefinition(viewModuleDefinition, file);
  return definition;
}

function omitViewFromClosureArguments(definitions: Closure[]) {
  return definitions.map((d) => ({
    ...d,
    types: {
      ...d.types,
      parameters: d.types?.parameters?.filter((t, idx) => idx !== 0 && t.name !== 'view'),
    },
  }));
}

// Some blocks have additional modifiers like runOnQueue – we may need to do additional traversing to get to the function definition
function parseBlockModifiers(structureObject: Structure) {
  if (structureObject['key.name'].includes('runOnQueue')) {
    return structureObject['key.substructure'][0];
  }
  return structureObject;
}

function parseModuleDefinition(
  moduleDefinition: Structure[],
  file: FileType
): OutputModuleDefinition {
  const preparedModuleDefinition = moduleDefinition.map(parseBlockModifiers);
  const parsedDefinition = {
    name: findNamedDefinitionsOfType('Name', preparedModuleDefinition, file)?.[0]?.name,
    functions: findNamedDefinitionsOfType('Function', preparedModuleDefinition, file),
    asyncFunctions: findNamedDefinitionsOfType('AsyncFunction', preparedModuleDefinition, file),
    events: findGroupedDefinitionsOfType('Events', preparedModuleDefinition, file),
    properties: findNamedDefinitionsOfType('Property', preparedModuleDefinition, file),
    props: omitViewFromClosureArguments(
      findNamedDefinitionsOfType('Prop', preparedModuleDefinition, file)
    ),
    view: findAndParseView(preparedModuleDefinition, file),
  };
  return parsedDefinition;
}

function findModuleDefinitionsInFiles(files: string[]) {
  const modules = [];
  for (const path of files) {
    const file = { path, content: fsNode.readFileSync(path, 'utf8') };
    const definition = findModuleDefinitionInStructure(getStructureFromFile(file));
    if (definition) {
      modules.push(parseModuleDefinition(definition, file));
    }
  }
  return modules;
}

export function getAllExpoModulesInWorkingDirectory() {
  const files = globSync(pattern);
  return findModuleDefinitionsInFiles(files);
}
