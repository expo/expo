#!/usr/bin/env node
'use strict';

import fs from 'fs';
import path from 'path';
import * as prettier from 'prettier';
import ts from 'typescript';

import {
  Closure,
  ClosureTypes,
  OutputModuleDefinition,
  OutputNestedClassDefinition,
} from './types';

const directoryPath = process.cwd();

/*
We receive types from SourceKitten and `getStructure` like so (examples):
[AcceptedTypes]?, UIColor?, [String: Any]

We need to parse them first to TS nodes in `mapSwiftTypeToTsType` with the following helper functions.
*/

function isSwiftArray(type: string) {
  // This can also be an object, but we check that first, so if it's not an object and is wrapped with [] it's an array.
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

function isEither(type: string) {
  return type.startsWith('Either<');
}
// "Either<TypeOne, TypeTwo>" -> ["TypeOne", "TypeTwo"]
function maybeUnwrapEither(type: string): string[] {
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

type TSNode =
  | ts.UnionTypeNode
  | ts.KeywordTypeNode
  | ts.TypeReferenceNode
  | ts.ArrayTypeNode
  | ts.OptionalTypeNode
  | ts.TypeLiteralNode;

/*
Main function that converts a string representation of a Swift type to a TypeScript compiler API node AST.
We can pass those types straight to a TypeScript printer (a function that converts AST to text).
*/
function mapSwiftTypeToTsType(type: string): TSNode {
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
  // Custom handling for the Either convertible
  if (isEither(type)) {
    return ts.factory.createUnionTypeNode(
      maybeUnwrapEither(type).map((t) => mapSwiftTypeToTsType(t))
    );
  }

  switch (type) {
    // Our custom representation for types that we have no type hints for. Not necessairly Swift any.
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
    case 'Any': // Swift Any type
      return ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
    default: // Custom Swift type (record) – for now mapped to a custom TS type exported at the top of the file by `getMockedTypes`.
      return ts.factory.createTypeReferenceNode(type);
  }
}

// Mocks require sample return values, so we generate them based on TS AST.
function getMockLiterals(tsReturnType: TSNode) {
  if (!tsReturnType) {
    return undefined;
  }
  switch (tsReturnType.kind) {
    case ts.SyntaxKind.AnyKeyword:
    case ts.SyntaxKind.VoidKeyword:
      return undefined;
    case ts.SyntaxKind.UnionType:
      // we take the first element of our union for the mock – we know the cast is correct since we create the type ourselves
      // the second is `undefined` for optionals.
      return getMockLiterals(tsReturnType.types[0] as TSNode);
    case ts.SyntaxKind.StringKeyword:
      return ts.factory.createStringLiteral('');
    case ts.SyntaxKind.BooleanKeyword:
      return ts.factory.createFalse();
    case ts.SyntaxKind.NumberKeyword:
      return ts.factory.createNumericLiteral('0');
    case ts.SyntaxKind.ArrayType:
      return ts.factory.createArrayLiteralExpression();
    case ts.SyntaxKind.TypeLiteral:
      // handles a dictionary, could be improved by creating an object fitting the schema instead of an empty one
      return ts.factory.createObjectLiteralExpression([], false);
  }
  return undefined;
}

function wrapWithAsync(tsType: ts.TypeNode) {
  return ts.factory.createTypeReferenceNode('Promise', [tsType]);
}

function maybeWrapWithReturnStatement(tsType: TSNode) {
  if (tsType.kind === ts.SyntaxKind.AnyKeyword || tsType.kind === ts.SyntaxKind.VoidKeyword) {
    return [];
  }
  if (tsType.kind === ts.SyntaxKind.TypeReference) {
    // A fallback – we print a comment that these mocks are not fitting the custom type. Could be improved by expanding a set of default mocks.
    return [
      ts.addSyntheticTrailingComment(
        ts.factory.createReturnStatement(ts.factory.createNull()),
        ts.SyntaxKind.SingleLineCommentTrivia,
        ` TODO: Replace with mock for value of type ${
          ((tsType as any)?.typeName as any)?.escapedText ?? ''
        }.`
      ),
    ];
  }
  return [ts.factory.createReturnStatement(getMockLiterals(tsType))];
}

/*
We iterate over a list of functions and we create TS AST for each of them.
*/
function getMockedFunctions(functions: Closure[], { async = false, classMethod = false } = {}) {
  return functions.map((fnStructure) => {
    const name = ts.factory.createIdentifier(fnStructure.name);
    const returnType = mapSwiftTypeToTsType(fnStructure.types?.returnType);
    const parameters =
      fnStructure?.types?.parameters.map((p) =>
        ts.factory.createParameterDeclaration(
          undefined,
          undefined,
          p.name ?? '_',
          undefined,
          mapSwiftTypeToTsType(p.typename),
          undefined
        )
      ) ?? [];
    const returnBlock = ts.factory.createBlock(maybeWrapWithReturnStatement(returnType), true);

    if (classMethod) {
      return ts.factory.createMethodDeclaration(
        [async ? ts.factory.createToken(ts.SyntaxKind.AsyncKeyword) : undefined].flatMap((f) =>
          f ? [f] : []
        ),
        undefined,
        name,
        undefined,
        undefined,
        parameters,
        async ? wrapWithAsync(returnType) : returnType,
        returnBlock
      );
    }
    const func = ts.factory.createFunctionDeclaration(
      [
        ts.factory.createToken(ts.SyntaxKind.ExportKeyword),
        async ? ts.factory.createToken(ts.SyntaxKind.AsyncKeyword) : undefined,
      ].flatMap((f) => (f ? [f] : [])),
      undefined,
      name,
      undefined,
      parameters,
      async ? wrapWithAsync(returnType) : returnType,
      returnBlock
    );
    return func;
  });
}

/**
 * Collect all type references used in any of the AST types to generate type aliases
 * e.g. type `[URL: string]?` will generate `type URL = any;`
 */
function getAllTypeReferences(node: ts.Node, accumulator: string[]) {
  if (ts.isTypeReferenceNode(node)) {
    accumulator.push((node.typeName as any)?.escapedText);
  }
  node.forEachChild((n) => getAllTypeReferences(n, accumulator));
}

/**
 * Iterates over types to collect the aliases.
 */
function getTypesToMock(module: OutputModuleDefinition | OutputNestedClassDefinition) {
  const foundTypes: string[] = [];

  Object.values(module)
    .flatMap((t) => (Array.isArray(t) ? t?.map((t2) => (t2 as Closure)?.types) : [] ?? []))
    .forEach((types: ClosureTypes | null) => {
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

const prefix = `Automatically generated by expo-modules-test-core.

This autogenerated file provides a mock for native Expo module,
and works out of the box with the expo jest preset.
`;
function getPrefix() {
  return [ts.factory.createJSDocComment(prefix)];
}

function generatePropTypesForDefinition(definition: OutputNestedClassDefinition) {
  return ts.factory.createTypeAliasDeclaration(
    [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
    'ViewProps',
    undefined,
    ts.factory.createTypeLiteralNode([
      ...definition.props.map((p) => {
        const propType = mapSwiftTypeToTsType(p.types.parameters[0].typename);
        return ts.factory.createPropertySignature(undefined, p.name, undefined, propType);
      }),
      ...definition.events.map((e) => {
        const eventType = ts.factory.createFunctionTypeNode(
          undefined,
          [
            ts.factory.createParameterDeclaration(
              undefined,
              undefined,
              'event',
              undefined,
              ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
            ),
          ],
          ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword)
        );
        return ts.factory.createPropertySignature(undefined, e.name, undefined, eventType);
      }),
    ])
  );
}
/*
Generate a mock for view props and functions.
*/
function getMockedViews(viewDefinitions: OutputNestedClassDefinition[]) {
  return viewDefinitions.flatMap((definition) => {
    if (!definition) {
      return [];
    }
    const propsType = generatePropTypesForDefinition(definition);
    const props = ts.factory.createParameterDeclaration(
      undefined,
      undefined,
      'props',
      undefined,
      ts.factory.createTypeReferenceNode('ViewProps', undefined),
      undefined
    );
    const viewFunction = ts.factory.createFunctionDeclaration(
      [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
      undefined,
      // TODO: Handle this better once requireNativeViewManager accepts view name or a different solution for multiple views is built.
      viewDefinitions.length === 1 ? 'View' : definition.name,
      undefined,
      [props],
      undefined,
      ts.factory.createBlock([])
    );
    return [propsType, viewFunction];
  });
}

function getMockedClass(def: OutputNestedClassDefinition) {
  const classDecl = ts.factory.createClassDeclaration(
    [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
    ts.factory.createIdentifier(def.name),
    undefined,
    undefined,
    [
      ...getMockedFunctions(def.functions, { classMethod: true }),
      ...getMockedFunctions(def.asyncFunctions, { async: true, classMethod: true }),
    ] as ts.MethodDeclaration[]
  );
  return classDecl;
}

function getMockedClasses(def: OutputNestedClassDefinition[]) {
  return def.map((d) => getMockedClass(d));
}

const newlineIdentifier = ts.factory.createIdentifier('\n\n') as any;
function separateWithNewlines<T>(arr: T) {
  return [arr, newlineIdentifier];
}

function omitFromSet(set: Set<string>, toOmit: (string | undefined)[]) {
  const newSet = new Set(set);
  toOmit.forEach((item) => {
    if (item) {
      newSet.delete(item);
    }
  });
  return newSet;
}

function getMockForModule(module: OutputModuleDefinition, includeTypes: boolean) {
  return (
    [] as (ts.TypeAliasDeclaration | ts.FunctionDeclaration | ts.JSDoc | ts.ClassDeclaration)[]
  )
    .concat(
      getPrefix(),
      newlineIdentifier,
      includeTypes
        ? getMockedTypes(
            omitFromSet(
              new Set([
                ...getTypesToMock(module),
                ...new Set(...module.views.map((v) => getTypesToMock(v))),
                ...new Set(...module.classes.map((c) => getTypesToMock(c))),
              ]),
              // Ignore all types that are actually native classes
              [
                module.name,
                ...module.views.map((c) => c.name),
                ...module.classes.map((c) => c.name),
              ]
            )
          )
        : [],
      newlineIdentifier,
      getMockedFunctions(module.functions) as ts.FunctionDeclaration[],
      getMockedFunctions(module.asyncFunctions, { async: true }) as ts.FunctionDeclaration[],
      newlineIdentifier,
      getMockedViews(module.views),
      getMockedClasses(module.classes)
    )
    .flatMap(separateWithNewlines);
}

async function prettifyCode(text: string, parser: 'babel' | 'typescript' = 'babel') {
  return await prettier.format(text, {
    parser,
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
    const printedTs = printer.printList(
      ts.ListFormat.MultiLine + ts.ListFormat.PreserveLines,
      mock,
      resultFile
    );

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
