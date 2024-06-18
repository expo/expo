#!/usr/bin/env node
'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMocks = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prettier = __importStar(require("prettier"));
const typescript_1 = __importDefault(require("typescript"));
const directoryPath = process.cwd();
/*
We receive types from SourceKitten and `getStructure` like so (examples):
[AcceptedTypes]?, UIColor?, [String: Any]

We need to parse them first to TS nodes in `mapSwiftTypeToTsType` with the following helper functions.
*/
function isSwiftArray(type) {
    // This can also be an object, but we check that first, so if it's not an object and is wrapped with [] it's an array.
    return type.startsWith('[') && type.endsWith(']');
}
function maybeUnwrapSwiftArray(type) {
    const isArray = isSwiftArray(type);
    if (!isArray) {
        return type;
    }
    const innerType = type.substring(1, type.length - 1);
    return innerType;
}
function isSwiftOptional(type) {
    return type.endsWith('?');
}
function maybeUnwrapSwiftOptional(type) {
    const isOptional = isSwiftOptional(type);
    if (!isOptional) {
        return type;
    }
    const innerType = type.substring(0, type.length - 1);
    return innerType;
}
function isSwiftDictionary(type) {
    return (type.startsWith('[') &&
        type.endsWith(']') &&
        findRootColonInDictionary(type.substring(1, type.length - 1)) >= 0);
}
function isEither(type) {
    return type.startsWith('Either<');
}
// "Either<TypeOne, TypeTwo>" -> ["TypeOne", "TypeTwo"]
function maybeUnwrapEither(type) {
    if (!isEither(type)) {
        return [type];
    }
    const innerType = type.substring(7, type.length - 1);
    return innerType.split(',').map((t) => t.trim());
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
function unwrapSwiftDictionary(type) {
    const innerType = type.substring(1, type.length - 1);
    const colonPosition = findRootColonInDictionary(innerType);
    return {
        key: innerType.slice(0, colonPosition).trim(),
        value: innerType.slice(colonPosition + 1).trim(),
    };
}
/*
Main function that converts a string representation of a Swift type to a TypeScript compiler API node AST.
We can pass those types straight to a TypeScript printer (a function that converts AST to text).
*/
function mapSwiftTypeToTsType(type) {
    if (!type) {
        return typescript_1.default.factory.createKeywordTypeNode(typescript_1.default.SyntaxKind.VoidKeyword);
    }
    if (isSwiftOptional(type)) {
        return typescript_1.default.factory.createUnionTypeNode([
            mapSwiftTypeToTsType(maybeUnwrapSwiftOptional(type)),
            typescript_1.default.factory.createKeywordTypeNode(typescript_1.default.SyntaxKind.UndefinedKeyword),
        ]);
    }
    if (isSwiftDictionary(type)) {
        const { key, value } = unwrapSwiftDictionary(type);
        const keyType = mapSwiftTypeToTsType(key);
        const valueType = mapSwiftTypeToTsType(value);
        const indexSignature = typescript_1.default.factory.createIndexSignature(undefined, [typescript_1.default.factory.createParameterDeclaration(undefined, undefined, 'key', undefined, keyType)], valueType);
        const typeLiteralNode = typescript_1.default.factory.createTypeLiteralNode([indexSignature]);
        return typeLiteralNode;
    }
    if (isSwiftArray(type)) {
        return typescript_1.default.factory.createArrayTypeNode(mapSwiftTypeToTsType(maybeUnwrapSwiftArray(type)));
    }
    // Custom handling for the Either convertible
    if (isEither(type)) {
        return typescript_1.default.factory.createUnionTypeNode(maybeUnwrapEither(type).map((t) => mapSwiftTypeToTsType(t)));
    }
    switch (type) {
        // Our custom representation for types that we have no type hints for. Not necessairly Swift any.
        case 'unknown':
            return typescript_1.default.factory.createKeywordTypeNode(typescript_1.default.SyntaxKind.AnyKeyword);
        case 'String':
            return typescript_1.default.factory.createKeywordTypeNode(typescript_1.default.SyntaxKind.StringKeyword);
        case 'Bool':
            return typescript_1.default.factory.createKeywordTypeNode(typescript_1.default.SyntaxKind.BooleanKeyword);
        case 'Int':
        case 'Float':
        case 'Double':
            return typescript_1.default.factory.createKeywordTypeNode(typescript_1.default.SyntaxKind.NumberKeyword);
        case 'Any': // Swift Any type
            return typescript_1.default.factory.createKeywordTypeNode(typescript_1.default.SyntaxKind.AnyKeyword);
        default: // Custom Swift type (record) – for now mapped to a custom TS type exported at the top of the file by `getMockedTypes`.
            return typescript_1.default.factory.createTypeReferenceNode(type);
    }
}
// Mocks require sample return values, so we generate them based on TS AST.
function getMockLiterals(tsReturnType) {
    if (!tsReturnType) {
        return undefined;
    }
    switch (tsReturnType.kind) {
        case typescript_1.default.SyntaxKind.AnyKeyword:
        case typescript_1.default.SyntaxKind.VoidKeyword:
            return undefined;
        case typescript_1.default.SyntaxKind.UnionType:
            // we take the first element of our union for the mock – we know the cast is correct since we create the type ourselves
            // the second is `undefined` for optionals.
            return getMockLiterals(tsReturnType.types[0]);
        case typescript_1.default.SyntaxKind.StringKeyword:
            return typescript_1.default.factory.createStringLiteral('');
        case typescript_1.default.SyntaxKind.BooleanKeyword:
            return typescript_1.default.factory.createFalse();
        case typescript_1.default.SyntaxKind.NumberKeyword:
            return typescript_1.default.factory.createNumericLiteral('0');
        case typescript_1.default.SyntaxKind.ArrayType:
            return typescript_1.default.factory.createArrayLiteralExpression();
        case typescript_1.default.SyntaxKind.TypeLiteral:
            // handles a dictionary, could be improved by creating an object fitting the schema instead of an empty one
            return typescript_1.default.factory.createObjectLiteralExpression([], false);
    }
    return undefined;
}
function wrapWithAsync(tsType) {
    return typescript_1.default.factory.createTypeReferenceNode('Promise', [tsType]);
}
function maybeWrapWithReturnStatement(tsType) {
    if (tsType.kind === typescript_1.default.SyntaxKind.AnyKeyword || tsType.kind === typescript_1.default.SyntaxKind.VoidKeyword) {
        return [];
    }
    if (tsType.kind === typescript_1.default.SyntaxKind.TypeReference) {
        // A fallback – we print a comment that these mocks are not fitting the custom type. Could be improved by expanding a set of default mocks.
        return [
            typescript_1.default.addSyntheticTrailingComment(typescript_1.default.factory.createReturnStatement(typescript_1.default.factory.createNull()), typescript_1.default.SyntaxKind.SingleLineCommentTrivia, ` TODO: Replace with mock for value of type ${tsType?.typeName?.escapedText ?? ''}.`),
        ];
    }
    return [typescript_1.default.factory.createReturnStatement(getMockLiterals(tsType))];
}
/*
We iterate over a list of functions and we create TS AST for each of them.
*/
function getMockedFunctions(functions, { async = false, classMethod = false } = {}) {
    return functions.map((fnStructure) => {
        const name = typescript_1.default.factory.createIdentifier(fnStructure.name);
        const returnType = mapSwiftTypeToTsType(fnStructure.types?.returnType);
        const parameters = fnStructure?.types?.parameters.map((p) => typescript_1.default.factory.createParameterDeclaration(undefined, undefined, p.name ?? '_', undefined, mapSwiftTypeToTsType(p.typename), undefined)) ?? [];
        const returnBlock = typescript_1.default.factory.createBlock(maybeWrapWithReturnStatement(returnType), true);
        if (classMethod) {
            return typescript_1.default.factory.createMethodDeclaration([async ? typescript_1.default.factory.createToken(typescript_1.default.SyntaxKind.AsyncKeyword) : undefined].flatMap((f) => f ? [f] : []), undefined, name, undefined, undefined, parameters, async ? wrapWithAsync(returnType) : returnType, returnBlock);
        }
        const func = typescript_1.default.factory.createFunctionDeclaration([
            typescript_1.default.factory.createToken(typescript_1.default.SyntaxKind.ExportKeyword),
            async ? typescript_1.default.factory.createToken(typescript_1.default.SyntaxKind.AsyncKeyword) : undefined,
        ].flatMap((f) => (f ? [f] : [])), undefined, name, undefined, parameters, async ? wrapWithAsync(returnType) : returnType, returnBlock);
        return func;
    });
}
/**
 * Collect all type references used in any of the AST types to generate type aliases
 * e.g. type `[URL: string]?` will generate `type URL = any;`
 */
function getAllTypeReferences(node, accumulator) {
    if (typescript_1.default.isTypeReferenceNode(node)) {
        accumulator.push(node.typeName?.escapedText);
    }
    node.forEachChild((n) => getAllTypeReferences(n, accumulator));
}
/**
 * Iterates over types to collect the aliases.
 */
function getTypesToMock(module) {
    const foundTypes = [];
    Object.values(module)
        .flatMap((t) => (Array.isArray(t) ? t?.map((t2) => t2?.types) : [] ?? []))
        .forEach((types) => {
        types?.parameters.forEach(({ typename }) => {
            getAllTypeReferences(mapSwiftTypeToTsType(typename), foundTypes);
        });
        types?.returnType &&
            getAllTypeReferences(mapSwiftTypeToTsType(types?.returnType), foundTypes);
    });
    return new Set(foundTypes);
}
/**
 * Gets a mock for a custom type.
 */
function getMockedTypes(types) {
    return Array.from(types).map((type) => {
        const name = typescript_1.default.factory.createIdentifier(type);
        const typeAlias = typescript_1.default.factory.createTypeAliasDeclaration([typescript_1.default.factory.createToken(typescript_1.default.SyntaxKind.ExportKeyword)], name, undefined, typescript_1.default.factory.createKeywordTypeNode(typescript_1.default.SyntaxKind.AnyKeyword));
        return typeAlias;
    });
}
const prefix = `Automatically generated by expo-modules-test-core.

This autogenerated file provides a mock for native Expo module,
and works out of the box with the expo jest preset.
`;
function getPrefix() {
    return [typescript_1.default.factory.createJSDocComment(prefix)];
}
function generatePropTypesForDefinition(definition) {
    return typescript_1.default.factory.createTypeAliasDeclaration([typescript_1.default.factory.createToken(typescript_1.default.SyntaxKind.ExportKeyword)], 'ViewProps', undefined, typescript_1.default.factory.createTypeLiteralNode([
        ...definition.props.map((p) => {
            const propType = mapSwiftTypeToTsType(p.types.parameters[0].typename);
            return typescript_1.default.factory.createPropertySignature(undefined, p.name, undefined, propType);
        }),
        ...definition.events.map((e) => {
            const eventType = typescript_1.default.factory.createFunctionTypeNode(undefined, [
                typescript_1.default.factory.createParameterDeclaration(undefined, undefined, 'event', undefined, typescript_1.default.factory.createKeywordTypeNode(typescript_1.default.SyntaxKind.AnyKeyword)),
            ], typescript_1.default.factory.createKeywordTypeNode(typescript_1.default.SyntaxKind.VoidKeyword));
            return typescript_1.default.factory.createPropertySignature(undefined, e.name, undefined, eventType);
        }),
    ]));
}
/*
Generate a mock for view props and functions.
*/
function getMockedViews(viewDefinitions) {
    return viewDefinitions.flatMap((definition) => {
        if (!definition) {
            return [];
        }
        const propsType = generatePropTypesForDefinition(definition);
        const props = typescript_1.default.factory.createParameterDeclaration(undefined, undefined, 'props', undefined, typescript_1.default.factory.createTypeReferenceNode('ViewProps', undefined), undefined);
        const viewFunction = typescript_1.default.factory.createFunctionDeclaration([typescript_1.default.factory.createToken(typescript_1.default.SyntaxKind.ExportKeyword)], undefined, 
        // TODO: Handle this better once requireNativeViewManager accepts view name or a different solution for multiple views is built.
        viewDefinitions.length === 1 ? 'View' : definition.name, undefined, [props], undefined, typescript_1.default.factory.createBlock([]));
        return [propsType, viewFunction];
    });
}
function getMockedClass(def) {
    const classDecl = typescript_1.default.factory.createClassDeclaration([typescript_1.default.factory.createToken(typescript_1.default.SyntaxKind.ExportKeyword)], typescript_1.default.factory.createIdentifier(def.name), undefined, undefined, [
        ...getMockedFunctions(def.functions, { classMethod: true }),
        ...getMockedFunctions(def.asyncFunctions, { async: true, classMethod: true }),
    ]);
    return classDecl;
}
function getMockedClasses(def) {
    return def.map((d) => getMockedClass(d));
}
const newlineIdentifier = typescript_1.default.factory.createIdentifier('\n\n');
function separateWithNewlines(arr) {
    return [arr, newlineIdentifier];
}
function omitFromSet(set, toOmit) {
    const newSet = new Set(set);
    toOmit.forEach((item) => {
        if (item) {
            newSet.delete(item);
        }
    });
    return newSet;
}
function getMockForModule(module, includeTypes) {
    return []
        .concat(getPrefix(), newlineIdentifier, includeTypes
        ? getMockedTypes(omitFromSet(new Set([
            ...getTypesToMock(module),
            ...new Set(...module.views.map((v) => getTypesToMock(v))),
            ...new Set(...module.classes.map((c) => getTypesToMock(c))),
        ]), 
        // Ignore all types that are actually native classes
        [
            module.name,
            ...module.views.map((c) => c.name),
            ...module.classes.map((c) => c.name),
        ]))
        : [], newlineIdentifier, getMockedFunctions(module.functions), getMockedFunctions(module.asyncFunctions, { async: true }), newlineIdentifier, getMockedViews(module.views), getMockedClasses(module.classes))
        .flatMap(separateWithNewlines);
}
async function prettifyCode(text, parser = 'babel') {
    return await prettier.format(text, {
        parser,
        tabWidth: 2,
        printWidth: 100,
        trailingComma: 'none',
        singleQuote: true,
    });
}
async function generateMocks(modules, outputLanguage = 'javascript') {
    const printer = typescript_1.default.createPrinter({ newLine: typescript_1.default.NewLineKind.LineFeed });
    for (const m of modules) {
        const filename = m.name + (outputLanguage === 'javascript' ? '.js' : '.ts');
        const resultFile = typescript_1.default.createSourceFile(filename, '', typescript_1.default.ScriptTarget.Latest, false, typescript_1.default.ScriptKind.TSX);
        fs_1.default.mkdirSync(path_1.default.join(directoryPath, 'mocks'), { recursive: true });
        const filePath = path_1.default.join(directoryPath, 'mocks', filename);
        // get ts nodearray from getMockForModule(m) array
        const mock = typescript_1.default.factory.createNodeArray(getMockForModule(m, outputLanguage === 'typescript'));
        const printedTs = printer.printList(typescript_1.default.ListFormat.MultiLine + typescript_1.default.ListFormat.PreserveLines, mock, resultFile);
        if (outputLanguage === 'javascript') {
            const compiledJs = typescript_1.default.transpileModule(printedTs, {
                compilerOptions: {
                    module: typescript_1.default.ModuleKind.ESNext,
                    target: typescript_1.default.ScriptTarget.ESNext,
                },
            }).outputText;
            const prettifiedJs = await prettifyCode(compiledJs);
            fs_1.default.writeFileSync(filePath, prettifiedJs);
        }
        else {
            const prettifiedTs = await prettifyCode(printedTs, 'typescript');
            fs_1.default.writeFileSync(filePath, prettifiedTs);
        }
    }
}
exports.generateMocks = generateMocks;
//# sourceMappingURL=mockgen.js.map