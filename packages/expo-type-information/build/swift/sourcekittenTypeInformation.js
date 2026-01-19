"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSwiftFileTypeInformation = getSwiftFileTypeInformation;
exports.preprocessSwiftFile = preprocessSwiftFile;
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const yaml_1 = __importDefault(require("yaml"));
const typeInformation_1 = require("../typeInformation");
function isSwiftDictionary(type) {
    return (type.startsWith('[') &&
        type.endsWith(']') &&
        findRootColonInDictionary(type.substring(1, type.length - 1)) >= 0);
}
function isSwiftArray(type) {
    // This can also be an object, but we check that first, so if it's not an object and is wrapped with [] it's an array.
    return type.startsWith('[') && type.endsWith(']');
}
function isSwiftOptional(type) {
    return type.endsWith('?');
}
function isParametrizedType(type) {
    return type.endsWith('>');
}
function isEitherTypeIdentifier(typeIdentifier) {
    return (typeIdentifier === 'Either' ||
        typeIdentifier === 'EitherOfThree' ||
        typeIdentifier === 'EitherOfFour');
}
function isEnumStructure(structure) {
    return structure['key.kind'] === 'source.lang.swift.decl.enum';
}
function isRecordStructure(structure) {
    return ((structure['key.kind'] === 'source.lang.swift.decl.struct' ||
        structure['key.kind'] === 'source.lang.swift.decl.class') &&
        structure['key.inheritedtypes'] &&
        structure['key.inheritedtypes'].find((type) => {
            return type['key.name'] === 'Record';
        }) !== undefined);
}
function isModuleStructure(structure) {
    return structure['key.typename'] === 'ModuleDefinition';
}
function unwrapSwiftArray(type) {
    const innerType = type.substring(1, type.length - 1);
    return mapSwiftTypeToTsType(innerType.trim());
}
function unwrapParametrizedType(type) {
    let openBracketCount = 0;
    let start = 0;
    const innerTypes = [];
    let name = '';
    for (let i = 0; i < type.length; i += 1) {
        if (type[i] === '<') {
            openBracketCount += 1;
            if (openBracketCount === 1) {
                name = type.substring(0, i);
                start = i + 1;
            }
        }
        else if (type[i] === '>') {
            openBracketCount -= 1;
            if (openBracketCount === 0) {
                innerTypes.push(mapSwiftTypeToTsType(type.substring(start, i).trim()));
                start = i + 1;
            }
        }
        else if (type[i] === ',' && openBracketCount === 1) {
            innerTypes.push(mapSwiftTypeToTsType(type.substring(start, i).trim()));
            start = i + 1;
        }
    }
    return { name, types: innerTypes };
}
function unwrapSwiftDictionary(type) {
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
function findRootColonInDictionary(type) {
    let colonIndex = -1;
    let openBracketsCount = 0;
    for (let i = 0; i < type.length; i++) {
        if (type[i] === '[') {
            openBracketsCount++;
        }
        else if (type[i] === ']') {
            openBracketsCount--;
        }
        else if (type[i] === ':' && openBracketsCount === 0) {
            colonIndex = i;
            break;
        }
    }
    return colonIndex;
}
function mapSwiftTypeToTsType(type) {
    if (!type) {
        return { kind: typeInformation_1.TypeKind.BASIC, type: typeInformation_1.BasicType.UNRESOLVED };
    }
    if (isSwiftOptional(type)) {
        return { kind: typeInformation_1.TypeKind.OPTIONAL, type: mapSwiftTypeToTsType(type.slice(0, -1).trim()) };
    }
    if (isSwiftDictionary(type)) {
        const { key, value } = unwrapSwiftDictionary(type);
        const keyType = mapSwiftTypeToTsType(key);
        const valueType = mapSwiftTypeToTsType(value);
        return {
            kind: typeInformation_1.TypeKind.DICTIONARY,
            type: {
                key: keyType,
                value: valueType,
            },
        };
    }
    if (isSwiftArray(type)) {
        return {
            kind: typeInformation_1.TypeKind.ARRAY,
            type: unwrapSwiftArray(type),
        };
    }
    if (isParametrizedType(type)) {
        const parametrizedType = unwrapParametrizedType(type);
        if (isEitherTypeIdentifier(parametrizedType.name)) {
            return {
                kind: typeInformation_1.TypeKind.SUM,
                type: parametrizedType,
            };
        }
        return {
            kind: typeInformation_1.TypeKind.PARAMETRIZED,
            type: parametrizedType,
        };
    }
    const returnType = {
        kind: typeInformation_1.TypeKind.BASIC,
        type: typeInformation_1.BasicType.ANY,
    };
    switch (type) {
        case 'unknown':
        case 'Any':
            returnType.type = typeInformation_1.BasicType.ANY;
            break;
        case 'String':
            returnType.type = typeInformation_1.BasicType.STRING;
            break;
        case 'Bool':
            returnType.type = typeInformation_1.BasicType.BOOLEAN;
            break;
        case 'Int':
        case 'Float':
        case 'Double':
            returnType.type = typeInformation_1.BasicType.NUMBER;
            break;
        case 'Void':
            returnType.type = typeInformation_1.BasicType.VOID;
            break;
        default:
            returnType.kind = typeInformation_1.TypeKind.IDENTIFIER;
            returnType.type = type;
    }
    return returnType;
}
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
// Read string straight from file – needed since we can't get cursorinfo for modulename
function getIdentifierFromOffsetObject(offsetObject, file) {
    // adding 1 and removing 1 to get rid of quotes
    return file.content
        .substring(offsetObject['key.offset'], offsetObject['key.offset'] + offsetObject['key.length'])
        .replaceAll('"', '');
}
function hasSubstructure(structure) {
    return structure?.['key.substructure'] && structure['key.substructure'].length > 0;
}
function findReturnType(structure, file) {
    if (structure['key.kind'] === 'source.lang.swift.decl.var.local' &&
        structure['key.name'].startsWith('returnValueDeclaration_')) {
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
let cachedSDKPath = null;
function getSDKPath() {
    if (cachedSDKPath) {
        return cachedSDKPath;
    }
    const sdkPath = (0, child_process_1.execSync)('xcrun --sdk iphoneos --show-sdk-path').toString().trim();
    cachedSDKPath = sdkPath;
    return cachedSDKPath;
}
function extractDeclarationType(structure, file) {
    if (structure['key.typename']) {
        return mapSwiftTypeToTsType(structure['key.typename']);
    }
    const inferReturn = getTypeOfByteOffsetVariable(structure['key.nameoffset'], file);
    return mapSwiftTypeToTsType(inferReturn ?? 'Any');
}
// Read type description with sourcekitten, works only for variables
// TODO This function is extremely slow and inefficient
// consider other options
function getTypeOfByteOffsetVariable(byteOffset, file) {
    const request = {
        'key.request': 'source.request.cursorinfo',
        'key.sourcefile': file.path,
        'key.offset': byteOffset,
        'key.compilerargs': [file.path, '-target', 'arm64-apple-ios7', '-sdk', getSDKPath()],
    };
    const yamlRequest = yaml_1.default.stringify(request, {
        defaultStringType: 'QUOTE_DOUBLE',
        lineWidth: 0,
        defaultKeyType: 'PLAIN',
        // needed since behaviour of sourcekitten is not consistent
    })
        .replace('"source.request.cursorinfo"', 'source.request.cursorinfo')
        .replaceAll('"', '\\"');
    const command = 'sourcekitten request --yaml "' + yamlRequest + '"';
    try {
        const output = JSON.parse((0, child_process_1.execSync)(command, { stdio: 'pipe' }).toString());
        const inferredType = output['key.typename'];
        if (inferredType === '<<error type>>') {
            return null;
        }
        return inferredType;
    }
    catch (error) {
        console.error('An error occurred while executing the command:', error);
    }
    return null;
}
function mapSourcekittenParameterToType(parameter) {
    return {
        name: parameter.name ?? undefined,
        type: mapSwiftTypeToTsType(parameter.typename),
    };
}
const parseModulePropertySubstructure = parseModuleConstantSubstructure;
function parseClosureTypes(structure, file) {
    const closure = structure['key.substructure']?.find((s) => s['key.kind'] === 'source.lang.swift.expr.closure');
    if (!closure) {
        // Try finding the preprocessed return value, if not found we don't know the return type
        const returnType = findReturnType(structure, file);
        return { parameters: [], returnType };
    }
    const parameters = closure['key.substructure']
        ?.filter((s) => s['key.kind'] === 'source.lang.swift.decl.var.parameter')
        .map((p) => ({
        name: p['key.name'] ?? undefined,
        typename: p['key.typename'],
    }));
    const returnType = closure?.['key.typename'] ?? findReturnType(structure, file);
    return { parameters, returnType };
}
function parseModuleConstructorDeclaration(substructure, file) {
    const definitionParams = substructure['key.substructure'];
    let types = null;
    // TODO rethink this maybe split based on what closure is expected
    // Maybe this should be the last substructure
    if (hasSubstructure(definitionParams[1])) {
        types = parseClosureTypes(definitionParams[1], file);
    }
    else if (hasSubstructure(definitionParams[0])) {
        types = parseClosureTypes(definitionParams[0], file);
    }
    else {
        // TODO REDO THIS
        // types = getTypeOfByteOffsetVariable(definitionParams[1]['key.offset'], file);
    }
    return {
        arguments: types?.parameters.map(mapSourcekittenParameterToType) ?? [],
    };
}
function parseModuleConstantSubstructure(substructure, file) {
    const definitionParams = substructure['key.substructure'];
    const name = getIdentifierFromOffsetObject(definitionParams[0], file);
    let types = null;
    if (hasSubstructure(definitionParams[1])) {
        types = parseClosureTypes(definitionParams[1], file);
    }
    else {
        // TODO REDO THIS
        // types = getTypeOfByteOffsetVariable(definitionParams[1]['key.offset'], file);
    }
    return {
        name,
        type: mapSwiftTypeToTsType(types?.returnType ?? undefined),
    };
}
function parseModuleClassSubstructure(substructure, file) {
    const nestedModuleStructure = substructure['key.substructure']?.[1]?.['key.substructure']?.[0]?.['key.substructure']?.[0]?.['key.substructure'];
    const name = getIdentifierFromOffsetObject(substructure['key.substructure']?.[0], file).replace('.self', '');
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
    const classTypeInfo = parseModuleStructure(nestedModuleStructure, file, 'GREPME Does Not Matter :)');
    return {
        name,
        methods: classTypeInfo.functions,
        asyncMethods: classTypeInfo.asyncFunctions,
        properties: classTypeInfo.properties,
        constructor: classTypeInfo.constructor,
    };
}
function parseModuleFunctionSubstructure(substructure, file) {
    const definitionParams = substructure['key.substructure'];
    const name = getIdentifierFromOffsetObject(definitionParams[0], file);
    let types = null;
    if (hasSubstructure(definitionParams[1])) {
        types = parseClosureTypes(definitionParams[1], file);
    }
    else {
        // TODO REDO THIS
        // types = getTypeOfByteOffsetVariable(definitionParams[1]['key.offset'], file);
    }
    return {
        name,
        returnType: mapSwiftTypeToTsType(types?.returnType ?? undefined), // any or void ? Probably any
        parameters: [], // TODO Module function is not generic. I think so. Check it
        arguments: types?.parameters?.map(mapSourcekittenParameterToType) ?? [],
    };
}
function parseModulePropDeclaration(substructure, file) {
    const definitionParams = substructure['key.substructure'];
    const name = getIdentifierFromOffsetObject(definitionParams[0], file);
    let types = null;
    if (hasSubstructure(definitionParams[1])) {
        types = parseClosureTypes(definitionParams[1], file);
    }
    else {
        // TODO REDO THIS
        // types = getTypeOfByteOffsetVariable(definitionParams[1]['key.offset'], file);
    }
    return {
        name,
        arguments: types?.parameters?.map(mapSourcekittenParameterToType) ?? [],
    };
}
function parseModuleViewDeclaration(substructure, file) {
    // The View arguments is a.self for some class a we want.
    const suffixLength = 5;
    const name = getIdentifierFromOffsetObject(substructure['key.substructure']?.[0], file).slice(0, -suffixLength);
    return parseModuleStructure(substructure['key.substructure'][1]['key.substructure'][0]['key.substructure'][0]['key.substructure'], file, name);
}
function parseModuleEventDeclaration(structure, file, events) {
    if (!structure) {
        return;
    }
    return structure['key.substructure'].forEach((substructure) => events.push(getIdentifierFromOffsetObject(substructure, file)));
}
function hasFieldAttribute(attributes, file) {
    if (!attributes) {
        return false;
    }
    for (const attribute of attributes) {
        const attributeString = file.content.substring(attribute['key.offset'], attribute['key.offset'] + attribute['key.length']);
        if (attributeString === '@Field') {
            return true;
        }
    }
    return false;
}
function parseRecordStructure(recordStructure, usedTypeIdentifiers, inferredTypeParametersCount, file) {
    const fields = [];
    for (const substructure of recordStructure['key.substructure']) {
        if (substructure['key.kind'] !== 'source.lang.swift.decl.var.instance' ||
            !hasFieldAttribute(substructure['key.attributes'], file)) {
            continue;
        }
        const type = extractDeclarationType(substructure, file);
        fields.push({
            name: substructure['key.name'],
            type,
        });
        collectTypeIdentifiers(type, usedTypeIdentifiers, inferredTypeParametersCount);
    }
    return {
        name: recordStructure['key.name'],
        fields,
    };
}
function parseEnumStructure(enumStructure) {
    const enumcases = [];
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
function parseModuleStructure(moduleStructure, file, name) {
    const mcd = {
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
function parseStructure(structure, name, modulesStructures, recordsStructures, enumsStructures) {
    const substructure = structure['key.substructure'];
    if (isModuleStructure(structure)) {
        modulesStructures.push({ structure, name });
    }
    else if (isRecordStructure(structure)) {
        recordsStructures.push(structure);
    }
    else if (isEnumStructure(structure)) {
        enumsStructures.push(structure);
    }
    else if (Array.isArray(substructure) && substructure.length > 0) {
        for (const substructure of structure['key.substructure']) {
            parseStructure(substructure, structure['key.name'] ?? name, modulesStructures, recordsStructures, enumsStructures);
        }
    }
}
function getTypeIdentifierDefinitionMap(fileTypeInformation) {
    const typeIdentifierDefinitionMap = new Map([]);
    fileTypeInformation.records.forEach((r) => typeIdentifierDefinitionMap.set(r.name, { kind: typeInformation_1.IdentifierKind.RECORD, definition: r }));
    fileTypeInformation.enums.forEach((e) => typeIdentifierDefinitionMap.set(e.name, { kind: typeInformation_1.IdentifierKind.ENUM, definition: e }));
    return typeIdentifierDefinitionMap;
}
function collectTypeIdentifiers(type, typeIdentiers, inferredTypeParametersCount) {
    switch (type.kind) {
        case typeInformation_1.TypeKind.ARRAY:
        case typeInformation_1.TypeKind.OPTIONAL:
            collectTypeIdentifiers(type.type, typeIdentiers, inferredTypeParametersCount);
            break;
        case typeInformation_1.TypeKind.DICTIONARY:
            collectTypeIdentifiers(type.type.key, typeIdentiers, inferredTypeParametersCount);
            collectTypeIdentifiers(type.type.value, typeIdentiers, inferredTypeParametersCount);
            break;
        case typeInformation_1.TypeKind.SUM:
            for (const t of type.type.types) {
                collectTypeIdentifiers(t, typeIdentiers, inferredTypeParametersCount);
            }
            break;
        case typeInformation_1.TypeKind.BASIC:
            // if ((type.type as BasicType) === BasicType.UNRESOLVED) {
            //   typeIdentiers.add('UnresolvedType');
            // }
            break;
        case typeInformation_1.TypeKind.IDENTIFIER:
            typeIdentiers.add(type.type);
            break;
        case typeInformation_1.TypeKind.PARAMETRIZED: {
            const parametrizedType = type.type;
            const typename = parametrizedType.name;
            typeIdentiers.add(typename);
            inferredTypeParametersCount.set(typename, Math.max(inferredTypeParametersCount.get(typename) ?? 0, parametrizedType.types.length));
            for (const t of type.type.types) {
                collectTypeIdentifiers(t, typeIdentiers, inferredTypeParametersCount);
            }
            break;
        }
    }
}
function collectModuleTypeIdentifiers(moduleClassDeclaration, fileTypeInformation) {
    const collect = (type) => {
        collectTypeIdentifiers(type, fileTypeInformation.usedTypeIdentifiers, fileTypeInformation.inferredTypeParametersCount);
    };
    const collectArg = (arg) => {
        collect(arg.type);
    };
    const collectFunction = (functionDeclaration) => {
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
function getSwiftFileTypeInformation(filePath) {
    const file = { path: filePath, content: fs_1.default.readFileSync(filePath, 'utf8') };
    const modulesStructures = [];
    const recordsStructures = [];
    const enumsStructures = [];
    parseStructure(getStructureFromFile(file), '', modulesStructures, recordsStructures, enumsStructures);
    const inferredTypeParametersCount = new Map();
    const moduleClasses = [];
    const moduleTypeIdentifiers = new Set();
    const declaredTypeIdentifiers = new Set();
    const recordTypeIdentifiers = new Set();
    const typeIdentifierDefinitionMap = new Map();
    const enums = enumsStructures.map(parseEnumStructure);
    const recordMap = (rd) => parseRecordStructure(rd, recordTypeIdentifiers, inferredTypeParametersCount, file);
    const records = recordsStructures.map(recordMap);
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
    for (const { structure, name } of modulesStructures) {
        if (!hasSubstructure(structure)) {
            continue;
        }
        const moduleClassDeclaration = parseModuleStructure(structure['key.substructure'], file, name);
        moduleClasses.push(moduleClassDeclaration);
        collectModuleTypeIdentifiers(moduleClassDeclaration, fileTypeInformation);
    }
    fileTypeInformation.typeIdentifierDefinitionMap =
        getTypeIdentifierDefinitionMap(fileTypeInformation);
    return fileTypeInformation;
}
// Preprocessing to help sourcekitten functions
// For now we create a new variable for each return statement,
// we can find it's type easily with sourcekitten
function removeComments(fileContent) {
    let multiLineComment = false;
    let singleLineComment = false;
    const newFileContent = [];
    let start = 0;
    for (let i = 0; i < fileContent.length; i += 1) {
        const char = fileContent[i];
        const nextChar = i + 1 < fileContent.length ? fileContent[i + 1] : null;
        switch (char) {
            case '/': {
                if (nextChar === '/' && !multiLineComment) {
                    singleLineComment = true;
                    newFileContent.push(fileContent.substring(start, i));
                }
                else if (nextChar === '*' && !singleLineComment) {
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
function returnExpressionEnd(fileContent, returnIndex) {
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
function preprocessSwiftFile(originalFileContent) {
    const newFileContent = [];
    const fileContent = removeComments(originalFileContent);
    const returnPositions = [];
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
        newFileContent.push(`let returnValueDeclaration_${start}_${end} = ${fileContent.substring(start + 6, end)}\n`);
        newFileContent.push(`return returnValueDeclaration_${start}_${end}\n`);
        prevEnd = end;
    }
    newFileContent.push(fileContent.substring(prevEnd, fileContent.length));
    return newFileContent.join('');
}
//# sourceMappingURL=sourcekittenTypeInformation.js.map