#!/usr/bin/env node
'use strict';

import fs from 'fs';
import path from 'path';
import * as prettier from 'prettier';
import ts from 'typescript';

import { Closure, ClosureTypes, OutputModuleDefinition } from './types';

const directoryPath = process.cwd();

function isSwiftArray(type: string) {
  return type.startsWith('[') && type.endsWith(']');
}
function maybeUnwrapSwiftArray(type: string) {
  const isArray = isSwiftArray(type);
  if (!isArray) {
    return type;
  }
  const innerType = type.substring(1, type.length - 1);
  return innerType;
}

function isSwiftOptional(type: string) {
  return type.endsWith('?');
}
function maybeUnwrapSwiftOptional(type: string) {
  const isOptional = isSwiftOptional(type);
  if (!isOptional) {
    return type;
  }
  const innerType = type.substring(0, type.length - 1);
  return innerType;
}

function isSwiftDictionary(type: string) {
  return (
    type.startsWith('[') &&
    type.endsWith(']') &&
    findRootColonInDictionary(type.substring(1, type.length - 1)) >= 0
  );
}
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
function unwrapSwiftDictionary(type: string) {
  const innerType = type.substring(1, type.length - 1);
  const colonPosition = findRootColonInDictionary(innerType);
  return {
    key: innerType.slice(0, colonPosition).trim(),
    value: innerType.slice(colonPosition + 1).trim(),
  };
}

type TSNodes =
  | ts.UnionTypeNode
  | ts.KeywordTypeNode
  | ts.TypeReferenceNode
  | ts.ArrayTypeNode
  | ts.OptionalTypeNode
  | ts.TypeLiteralNode;

function mapSwiftTypeToTsType(type: string): TSNodes {
  if (!type) {
    return ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword);
  }
  if (isSwiftOptional(type)) {
    return ts.factory.createUnionTypeNode([
      mapSwiftTypeToTsType(maybeUnwrapSwiftOptional(type)),
      ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword),
    ]);
  }
  if (isSwiftDictionary(type)) {
    const { key, value } = unwrapSwiftDictionary(type);
    const keyType = mapSwiftTypeToTsType(key);
    const valueType = mapSwiftTypeToTsType(value);

    const indexSignature = ts.factory.createIndexSignature(
      undefined,
      [ts.factory.createParameterDeclaration(undefined, undefined, 'key', undefined, keyType)],
      valueType
    );

    const typeLiteralNode = ts.factory.createTypeLiteralNode([indexSignature]);
    return typeLiteralNode;
  }
  if (isSwiftArray(type)) {
    return ts.factory.createArrayTypeNode(mapSwiftTypeToTsType(maybeUnwrapSwiftArray(type)));
  }
  switch (type) {
    case 'unknown':
      return ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
    case 'String':
      return ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
    case 'Bool':
      return ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);
    case 'Int':
    case 'Float':
    case 'Double':
      return ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
    case 'Any':
      return ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
    default:
      return ts.factory.createTypeReferenceNode(type);
  }
}

function getMockLiterals(tsReturnType: TSNodes) {
  if (!tsReturnType) {
    return undefined;
  }
  switch (tsReturnType.kind) {
    case ts.SyntaxKind.AnyKeyword:
      return undefined;
    case ts.SyntaxKind.UnionType:
      // we know the cast is correct since we create the type ourselves
      return getMockLiterals(tsReturnType.types[0] as TSNodes);
    case ts.SyntaxKind.StringKeyword:
      return ts.factory.createStringLiteral('');
    case ts.SyntaxKind.BooleanKeyword:
      return ts.factory.createFalse();
    case ts.SyntaxKind.NumberKeyword:
      return ts.factory.createNumericLiteral('0');
    case ts.SyntaxKind.VoidKeyword:
      return undefined;
    case ts.SyntaxKind.ArrayType:
      return ts.factory.createArrayLiteralExpression();
    case ts.SyntaxKind.TypeLiteral:
      return ts.factory.createObjectLiteralExpression([], false);
    case ts.SyntaxKind.TypeReference:
      // can be improved by expanding a set of default mocks
      return ts.addSyntheticTrailingComment(
        ts.factory.createNull(),
        ts.SyntaxKind.SingleLineCommentTrivia,
        ` TODO: Replace with mock for value of type ${
          ((tsReturnType as any).typeName as any)?.escapedText ?? ''
        }.`
      );
  }
  return undefined;
}

function wrapWithAsync(tsType: ts.TypeNode) {
  return ts.factory.createTypeReferenceNode('Promise', [tsType]);
}

function maybeWrapWithReturnStatement(tsType: TSNodes) {
  if (tsType.kind === ts.SyntaxKind.AnyKeyword) {
    return [];
  }
  return [ts.factory.createReturnStatement(getMockLiterals(tsType))];
}

function getMockedFunctions(functions: Closure[], async = false) {
  return functions.map((fnStructure) => {
    const name = ts.factory.createIdentifier(fnStructure.name);
    const returnType = mapSwiftTypeToTsType(fnStructure.types?.returnType);
    const func = ts.factory.createFunctionDeclaration(
      [
        ts.factory.createToken(ts.SyntaxKind.ExportKeyword),
        async ? ts.factory.createToken(ts.SyntaxKind.AsyncKeyword) : undefined,
      ].filter((f) => !!f) as ts.ModifierToken<any>[],
      undefined,
      name,
      undefined,
      fnStructure?.types?.parameters.map((p) =>
        ts.factory.createParameterDeclaration(
          undefined,
          undefined,
          p.name,
          undefined,
          mapSwiftTypeToTsType(p.typename),
          undefined
        )
      ) ?? [],
      async ? wrapWithAsync(returnType) : returnType,
      ts.factory.createBlock(maybeWrapWithReturnStatement(returnType), true)
    );
    return func;
  });
}

function getTypesToMock(module: OutputModuleDefinition) {
  const foundTypes: string[] = [];

  Object.values(module)
    .flatMap((t) => (Array.isArray(t) ? t?.map((t2) => (t2 as Closure)?.types) : [] ?? []))
    .forEach((types: ClosureTypes | null) => {
      types?.parameters.forEach(({ typename }) => {
        foundTypes.push(maybeUnwrapSwiftArray(typename));
      });
      types?.returnType && foundTypes.push(maybeUnwrapSwiftArray(types.returnType));
    });
  return new Set(
    foundTypes.filter((ft) => mapSwiftTypeToTsType(ft).kind === ts.SyntaxKind.TypeReference)
  );
}

function getMockedTypes(types: Set<string>) {
  return Array.from(types).map((type) => {
    const name = ts.factory.createIdentifier(type);
    const typeAlias = ts.factory.createTypeAliasDeclaration(
      [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
      name,
      undefined,
      ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
    );
    return typeAlias;
  });
}

const prefix = `
Automatically generated by expo-modules-test-core.

This autogenerated file provides a mock for native Expo module,
and works out of the box with the expo jest preset.
`;
function getPrefix() {
  return [ts.factory.createJSDocComment(prefix)];
}

function getMockForModule(module: OutputModuleDefinition, includeTypes: boolean) {
  return ([] as (ts.TypeAliasDeclaration | ts.FunctionDeclaration | ts.JSDoc)[]).concat(
    getPrefix(),
    includeTypes ? getMockedTypes(getTypesToMock(module)) : [],
    getMockedFunctions(module.functions),
    getMockedFunctions(module.asyncFunctions, true)
  );
}

async function prettifyCode(text: string, parser: 'babel' | 'typescript' = 'babel') {
  return await prettier.format(text, {
    parser,
    plugins: parser === 'typescript' ? ['@babel/plugin-syntax-typescript'] : undefined,
    tabWidth: 2,
    printWidth: 100,
    trailingComma: 'none',
    singleQuote: true,
  });
}

export async function generateMocks(
  modules: OutputModuleDefinition[],
  outputLanguage: 'javascript' | 'typescript' = 'javascript'
) {
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

  for (const m of modules) {
    const filename = m.name + (outputLanguage === 'javascript' ? '.js' : '.ts');
    const resultFile = ts.createSourceFile(
      filename,
      '',
      ts.ScriptTarget.Latest,
      false,
      ts.ScriptKind.TSX
    );
    fs.mkdirSync(path.join(directoryPath, 'mocks'), { recursive: true });
    const filePath = path.join(directoryPath, 'mocks', filename);
    // get ts nodearray from getMockForModule(m) array
    const mock = ts.factory.createNodeArray(getMockForModule(m, outputLanguage === 'typescript'));
    const printedTs = printer.printList(ts.ListFormat.MultiLine, mock, resultFile);

    if (outputLanguage === 'javascript') {
      const compiledJs = ts.transpileModule(printedTs, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ESNext,
        },
      }).outputText;
      const prettifiedJs = await prettifyCode(compiledJs);
      fs.writeFileSync(filePath, prettifiedJs);
    } else {
      const prettifiedTs = await prettifyCode(printedTs, 'typescript');
      fs.writeFileSync(filePath, prettifiedTs);
    }
  }
}
