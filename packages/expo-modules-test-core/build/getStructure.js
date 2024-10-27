"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllExpoModulesInWorkingDirectory = void 0;
// convert requires above to imports
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const glob_1 = require("glob");
const xml_js_1 = __importDefault(require("xml-js"));
const yaml_1 = __importDefault(require("yaml"));
const rootDir = process.cwd();
const pattern = `${rootDir}/**/*.swift`;
function getStructureFromFile(file) {
    const command = 'sourcekitten structure --file ' + file.path;
    try {
        const output = (0, child_process_1.execSync)(command);
        return JSON.parse(output.toString());
    }
    catch (error) {
        console.error('An error occurred while executing the command:', error);
    }
}
// find an object with "key.typename" : "ModuleDefinition" somewhere in the structure and return it
function findModuleDefinitionInStructure(structure) {
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
function getIdentifierFromOffsetObject(offsetObject, file) {
    // adding 1 and removing 1 to get rid of quotes
    return file.content
        .substring(offsetObject['key.offset'], offsetObject['key.offset'] + offsetObject['key.length'])
        .replaceAll('"', '');
}
function maybeUnwrapXMLStructs(type) {
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
function maybeWrapArray(itemOrItems) {
    if (!itemOrItems) {
        return null;
    }
    if (Array.isArray(itemOrItems)) {
        return itemOrItems;
    }
    else {
        return [itemOrItems];
    }
}
function parseXMLAnnotatedDeclarations(cursorInfoOutput) {
    const xml = cursorInfoOutput['key.fully_annotated_decl'];
    if (!xml) {
        return null;
    }
    const parsed = xml_js_1.default.xml2js(xml, { compact: true });
    const parameters = maybeWrapArray(parsed?.['decl.function.free']?.['decl.var.parameter'])?.map((p) => ({
        name: maybeUnwrapXMLStructs(p['decl.var.parameter.argument_label']),
        typename: maybeUnwrapXMLStructs(p['decl.var.parameter.type']),
    })) ?? [];
    const returnType = maybeUnwrapXMLStructs(parsed?.['decl.function.free']?.['decl.function.returntype']);
    return { parameters, returnType };
}
let cachedSDKPath = null;
function getSDKPath() {
    if (cachedSDKPath) {
        return cachedSDKPath;
    }
    const sdkPath = (0, child_process_1.execSync)('xcrun --sdk iphoneos --show-sdk-path').toString().trim();
    cachedSDKPath = sdkPath;
    return cachedSDKPath;
}
// Read type description with sourcekitten, works only for variables
function getTypeFromOffsetObject(offsetObject, file) {
    if (!offsetObject) {
        return null;
    }
    const request = {
        'key.request': 'source.request.cursorinfo',
        'key.sourcefile': file.path,
        'key.offset': offsetObject['key.offset'],
        'key.compilerargs': [file.path, '-target', 'arm64-apple-ios', '-sdk', getSDKPath()],
    };
    const yamlRequest = yaml_1.default.stringify(request, {
        defaultStringType: 'QUOTE_DOUBLE',
        lineWidth: 0,
        defaultKeyType: 'PLAIN',
        // needed since behaviour of sourcekitten is not consistent
    }).replace('"source.request.cursorinfo"', 'source.request.cursorinfo');
    const command = 'sourcekitten request --yaml "' + yamlRequest.replaceAll('"', '\\"') + '"';
    try {
        const output = (0, child_process_1.execSync)(command, { stdio: 'pipe' });
        return parseXMLAnnotatedDeclarations(JSON.parse(output.toString()));
    }
    catch (error) {
        console.error('An error occurred while executing the command:', error);
    }
    return null;
}
function hasSubstructure(structureObject) {
    return structureObject?.['key.substructure'] && structureObject['key.substructure'].length > 0;
}
function parseClosureTypes(structureObject) {
    const closure = structureObject['key.substructure']?.find((s) => s['key.kind'] === 'source.lang.swift.expr.closure');
    if (!closure) {
        return null;
    }
    const parameters = closure['key.substructure']
        ?.filter((s) => s['key.kind'] === 'source.lang.swift.decl.var.parameter')
        .map((p) => ({ name: p['key.name'], typename: p['key.typename'] }));
    const returnType = closure?.['key.typename'] ?? 'unknown';
    return { parameters, returnType };
}
// Used for functions,async functions, all of shape Identifier(name, closure or function)
function findNamedDefinitionsOfType(type, moduleDefinition, file) {
    const definitionsOfType = moduleDefinition.filter((md) => md['key.name'] === type);
    return definitionsOfType.map((d) => {
        const definitionParams = d['key.substructure'];
        const name = getIdentifierFromOffsetObject(definitionParams[0], file);
        let types = null;
        if (hasSubstructure(definitionParams[1])) {
            types = parseClosureTypes(definitionParams[1]);
        }
        else {
            types = getTypeFromOffsetObject(definitionParams[1], file);
        }
        return { name, types };
    });
}
// Used for events
function findGroupedDefinitionsOfType(type, moduleDefinition, file) {
    const definitionsOfType = moduleDefinition.filter((md) => md['key.name'] === type);
    return definitionsOfType.flatMap((d) => {
        const definitionParams = d['key.substructure'];
        return definitionParams.map((d) => ({ name: getIdentifierFromOffsetObject(d, file) }));
    });
}
function findAndParseNestedClassesOfType(moduleDefinition, file, type) {
    // we support reading definitions from closure only
    const definitionsOfType = moduleDefinition.filter((md) => md['key.name'] === type);
    return definitionsOfType
        .map((df) => {
        const nestedModuleDefinition = df['key.substructure']?.[1]?.['key.substructure']?.[0]?.['key.substructure']?.[0]?.['key.substructure'];
        if (!nestedModuleDefinition) {
            console.warn('Could not parse definition');
            return null;
        }
        const name = getIdentifierFromOffsetObject(df['key.substructure']?.[0], file).replace('.self', '');
        // let's drop nested view field and classes (are null anyways)
        const { views: _, classes: _2, ...definition } = parseModuleDefinition(nestedModuleDefinition, file);
        return { ...definition, name };
    })
        .flatMap((f) => (f ? [f] : []));
}
function omitParamsFromClosureArguments(definitions, paramsToOmit) {
    return definitions.map((d) => ({
        ...d,
        types: {
            ...d.types,
            parameters: d.types?.parameters?.filter((t, idx) => !paramsToOmit.includes(t.name)) ?? [],
        },
    }));
}
// Some blocks have additional modifiers like runOnQueue – we may need to do additional traversing to get to the function definition
function parseBlockModifiers(structureObject) {
    if (structureObject['key.name']?.includes('runOnQueue')) {
        return structureObject['key.substructure'][0];
    }
    return structureObject;
}
function parseModuleDefinition(moduleDefinition, file) {
    const preparedModuleDefinition = moduleDefinition.map(parseBlockModifiers);
    const parsedDefinition = {
        name: findNamedDefinitionsOfType('Name', preparedModuleDefinition, file)?.[0]?.name,
        functions: findNamedDefinitionsOfType('Function', preparedModuleDefinition, file),
        asyncFunctions: omitParamsFromClosureArguments(findNamedDefinitionsOfType('AsyncFunction', preparedModuleDefinition, file), ['promise']),
        events: findGroupedDefinitionsOfType('Events', preparedModuleDefinition, file),
        properties: findNamedDefinitionsOfType('Property', preparedModuleDefinition, file),
        props: omitParamsFromClosureArguments(findNamedDefinitionsOfType('Prop', preparedModuleDefinition, file), ['view']),
        views: findAndParseNestedClassesOfType(preparedModuleDefinition, file, 'View'),
        classes: findAndParseNestedClassesOfType(preparedModuleDefinition, file, 'Class'),
    };
    return parsedDefinition;
}
function findModuleDefinitionsInFiles(files) {
    const modules = [];
    for (const path of files) {
        const file = { path, content: fs_1.default.readFileSync(path, 'utf8') };
        const definition = findModuleDefinitionInStructure(getStructureFromFile(file));
        if (definition) {
            modules.push(parseModuleDefinition(definition, file));
        }
    }
    return modules;
}
function getAllExpoModulesInWorkingDirectory() {
    const files = (0, glob_1.globSync)(pattern);
    return findModuleDefinitionsInFiles(files);
}
exports.getAllExpoModulesInWorkingDirectory = getAllExpoModulesInWorkingDirectory;
//# sourceMappingURL=getStructure.js.map