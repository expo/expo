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
function maybeUnwrapSwiftArray(type) {
    const isArray = type.startsWith('[') && type.endsWith(']');
    if (!isArray) {
        return type;
    }
    const innerType = type.substring(1, type.length - 1);
    return innerType;
}
function isSwiftArray(type) {
    return type.startsWith('[') && type.endsWith(']');
}
function mapSwiftTypeToTsType(type) {
    if (!type) {
        return typescript_1.default.factory.createKeywordTypeNode(typescript_1.default.SyntaxKind.VoidKeyword);
    }
    if (isSwiftArray(type)) {
        return typescript_1.default.factory.createArrayTypeNode(mapSwiftTypeToTsType(maybeUnwrapSwiftArray(type)));
    }
    switch (type) {
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
        default:
            return typescript_1.default.factory.createTypeReferenceNode(type);
    }
}
function getMockReturnStatements(tsReturnType) {
    if (!tsReturnType) {
        return [];
    }
    switch (tsReturnType.kind) {
        case typescript_1.default.SyntaxKind.AnyKeyword:
            return [typescript_1.default.factory.createReturnStatement(typescript_1.default.factory.createNull())];
        case typescript_1.default.SyntaxKind.StringKeyword:
            return [typescript_1.default.factory.createReturnStatement(typescript_1.default.factory.createStringLiteral(''))];
        case typescript_1.default.SyntaxKind.BooleanKeyword:
            return [typescript_1.default.factory.createReturnStatement(typescript_1.default.factory.createFalse())];
        case typescript_1.default.SyntaxKind.NumberKeyword:
            return [typescript_1.default.factory.createReturnStatement(typescript_1.default.factory.createNumericLiteral('0'))];
        case typescript_1.default.SyntaxKind.VoidKeyword:
            return [];
        case typescript_1.default.SyntaxKind.ArrayType:
            return [typescript_1.default.factory.createReturnStatement(typescript_1.default.factory.createArrayLiteralExpression())];
        case typescript_1.default.SyntaxKind.TypeReference:
            // can be improved by expanding a set of default mocks
            return [
                typescript_1.default.addSyntheticTrailingComment(typescript_1.default.factory.createReturnStatement(typescript_1.default.factory.createNull()), typescript_1.default.SyntaxKind.SingleLineCommentTrivia, ` TODO: Replace with mock for value of type ${tsReturnType.typeName?.escapedText ?? ''}.`),
            ];
    }
    return [];
}
function wrapWithAsync(tsType) {
    return typescript_1.default.factory.createTypeReferenceNode('Promise', [tsType]);
}
function getMockedFunctions(functions, async = false) {
    return functions.map((fnStructure) => {
        const name = typescript_1.default.factory.createIdentifier(fnStructure.name);
        const returnType = mapSwiftTypeToTsType(fnStructure.types?.returnType);
        const func = typescript_1.default.factory.createFunctionDeclaration([
            typescript_1.default.factory.createToken(typescript_1.default.SyntaxKind.ExportKeyword),
            async ? typescript_1.default.factory.createToken(typescript_1.default.SyntaxKind.AsyncKeyword) : undefined,
        ].filter((f) => !!f), undefined, name, undefined, fnStructure?.types?.parameters.map((p) => typescript_1.default.factory.createParameterDeclaration(undefined, undefined, p.name, undefined, mapSwiftTypeToTsType(p.typename), undefined)) ?? [], async ? wrapWithAsync(returnType) : returnType, typescript_1.default.factory.createBlock(getMockReturnStatements(returnType), true));
        return func;
    });
}
function getTypesToMock(module) {
    const foundTypes = [];
    Object.values(module)
        .flatMap((t) => (Array.isArray(t) ? t?.map((t2) => t2?.types) : [] ?? []))
        .forEach((types) => {
        types?.parameters.forEach(({ typename }) => {
            foundTypes.push(maybeUnwrapSwiftArray(typename));
        });
        types?.returnType && foundTypes.push(maybeUnwrapSwiftArray(types.returnType));
    });
    return new Set(foundTypes.filter((ft) => mapSwiftTypeToTsType(ft).kind === typescript_1.default.SyntaxKind.TypeReference));
}
function getMockedTypes(types) {
    return Array.from(types).map((type) => {
        const name = typescript_1.default.factory.createIdentifier(type);
        const typeAlias = typescript_1.default.factory.createTypeAliasDeclaration([typescript_1.default.factory.createToken(typescript_1.default.SyntaxKind.ExportKeyword)], name, undefined, typescript_1.default.factory.createKeywordTypeNode(typescript_1.default.SyntaxKind.AnyKeyword));
        return typeAlias;
    });
}
const prefix = `
Automatically generated by expo-modules-test-core.

This autogenerated file provides a mock for native Expo module,
and works out of the box with the expo jest preset.
`;
function getPrefix() {
    return [typescript_1.default.factory.createJSDocComment(prefix)];
}
function getMockForModule(module) {
    return [].concat(getMockedTypes(getTypesToMock(module)), getPrefix(), getMockedFunctions(module.functions), getMockedFunctions(module.asyncFunctions, true));
}
async function generateMocks(modules) {
    const printer = typescript_1.default.createPrinter({ newLine: typescript_1.default.NewLineKind.LineFeed });
    for (const m of modules) {
        const resultFile = typescript_1.default.createSourceFile(m.name + '.ts', '', typescript_1.default.ScriptTarget.Latest, false, typescript_1.default.ScriptKind.TSX);
        fs_1.default.mkdirSync(path_1.default.join(directoryPath, 'mocks'), { recursive: true });
        const filePath = path_1.default.join(directoryPath, 'mocks', m.name + '.ts');
        // get ts nodearray from getMockForModule(m) array
        const mock = typescript_1.default.factory.createNodeArray(getMockForModule(m));
        const printedTs = printer.printList(typescript_1.default.ListFormat.MultiLine, mock, resultFile);
        const compiledJs = typescript_1.default.transpileModule(printedTs, {
            compilerOptions: {
                module: typescript_1.default.ModuleKind.ESNext,
                target: typescript_1.default.ScriptTarget.ESNext,
            },
        }).outputText;
        const prettyJs = await prettier.format(compiledJs, {
            parser: 'babel',
            tabWidth: 2,
            singleQuote: true,
        });
        fs_1.default.writeFileSync(filePath, prettyJs);
    }
}
exports.generateMocks = generateMocks;
//# sourceMappingURL=mockgen.js.map