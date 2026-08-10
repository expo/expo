'use strict';
import prettier from 'prettier';
import ts from 'typescript';

import {
  Argument,
  ArrayType,
  BasicType,
  ClassDeclaration,
  ConstantDeclaration,
  ConstructorDeclaration,
  ConvertibleType,
  DictionaryType,
  EnumType,
  EventDeclaration,
  FileTypeInformation,
  FunctionDeclaration,
  ModuleClassDeclaration,
  ParametrizedType,
  PropDeclaration,
  PropertyDeclaration,
  RecordType,
  SumType,
  Type,
  TypeKind,
  ViewDeclaration,
} from './typeInformation.types';

const exportModifier = () => ts.factory.createModifier(ts.SyntaxKind.ExportKeyword);
const declareModifier = () => ts.factory.createModifier(ts.SyntaxKind.DeclareKeyword);
const asyncModifier = () => ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword);
const readonlyModifier = () => ts.factory.createModifier(ts.SyntaxKind.ReadonlyKeyword);
const staticModifier = () => ts.factory.createModifier(ts.SyntaxKind.StaticKeyword);
const constModifier = () => ts.factory.createModifier(ts.SyntaxKind.ConstKeyword);
const defaultModifier = () => ts.factory.createModifier(ts.SyntaxKind.DefaultKeyword);

const unknownKeywordType = () => ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword);
const anyKeywordType = () => ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
const voidKeywordType = () => ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword);
const numberKeywordType = () => ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
const stringKeywordType = () => ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);

const newlineIdentifier = () => ts.factory.createIdentifier('\n\n');

/**
 * A helper type which contains the generated file content and name.
 */
export type OutputFile = {
  /**
   * Generated file content.
   */
  content: string;
  /**
   * Generated file base name (e.g. `ExpoSettings.types.ts`).
   */
  name: string;
};

export interface GenerationContext {
  fileInfo: FileTypeInformation;
  module: ModuleClassDeclaration;
  view: ViewDeclaration | null;
  missingTypes: Set<string>;
}

let freeId = 0;
function getNextFreeId() {
  freeId += 1;
  return freeId;
}

export function createDefaultGenerationContext(
  fileInfo: FileTypeInformation
): GenerationContext | null {
  const module = fileInfo.moduleClasses[0];
  if (!module) {
    return null;
  }
  const view = module.views[0] ?? null;
  return {
    fileInfo,
    module,
    view,
    missingTypes: getMissingTypeIdentifiers(fileInfo),
  };
}

export function createGenerationContext(
  fileInfo: FileTypeInformation,
  moduleClassDeclaration: ModuleClassDeclaration
): GenerationContext {
  return {
    fileInfo,
    module: moduleClassDeclaration,
    view: moduleClassDeclaration.views[0] ?? null,
    missingTypes: getMissingTypeIdentifiers(fileInfo),
  };
}

export function getBasicTypesIdentifiers(): Set<string> {
  return new Set<string>(['any', 'number', 'string', 'undefined', 'null', 'Map', 'Set', 'Promise']);
}

function constructModifiersArray(modifiers: {
  exported?: boolean;
  declare?: boolean;
  async?: boolean;
  readonly?: boolean;
  isStatic?: boolean;
}): ts.Modifier[] {
  const modifiersArray: ts.Modifier[] = [];
  if (modifiers.exported) modifiersArray.push(exportModifier());
  if (modifiers.declare) modifiersArray.push(declareModifier());
  if (modifiers.async) modifiersArray.push(asyncModifier());
  if (modifiers.readonly) modifiersArray.push(readonlyModifier());
  if (modifiers.isStatic) modifiersArray.push(staticModifier());
  return modifiersArray;
}

export function joinTSNodesWithNewlines(nodes: ts.Node[][]): ts.Node[] {
  const newNodes: ts.Node[] = [];
  for (const node of nodes) {
    if (node.length > 0) {
      newNodes.push(...node);
      newNodes.push(newlineIdentifier());
    }
  }
  return newNodes;
}

const BASIC_TYPE_MAP: Record<BasicType, ts.KeywordTypeSyntaxKind> = {
  [BasicType.ANY]: ts.SyntaxKind.AnyKeyword,
  [BasicType.BOOLEAN]: ts.SyntaxKind.BooleanKeyword,
  [BasicType.NUMBER]: ts.SyntaxKind.NumberKeyword,
  [BasicType.STRING]: ts.SyntaxKind.StringKeyword,
  [BasicType.VOID]: ts.SyntaxKind.VoidKeyword,
  [BasicType.UNDEFINED]: ts.SyntaxKind.UndefinedKeyword,
  [BasicType.NEVER]: ts.SyntaxKind.NeverKeyword,
  [BasicType.OBJECT]: ts.SyntaxKind.ObjectKeyword,
  [BasicType.UNRESOLVED]: ts.SyntaxKind.UndefinedKeyword, // This is handled separately
  [BasicType.NULL]: ts.SyntaxKind.UndefinedKeyword, // This is handled separately
};

function mapBasicTypeToTypeNode(basicType: BasicType): ts.TypeNode {
  if (basicType === BasicType.UNRESOLVED) {
    return ts.addSyntheticTrailingComment(
      unknownKeywordType(),
      ts.SyntaxKind.MultiLineCommentTrivia,
      "The type couldn't be resolved automatically."
    );
  }
  if (basicType === BasicType.NULL) {
    return ts.factory.createLiteralTypeNode(ts.factory.createNull());
  }

  return ts.factory.createKeywordTypeNode(BASIC_TYPE_MAP[basicType]);
}

const CONVERTIBLE_TYPE_MAP: Record<ConvertibleType, () => ts.TypeNode> = {
  [ConvertibleType.COLOR]: () => ts.factory.createTypeReferenceNode('ColorValue'),
  [ConvertibleType.UINT8_ARRAY]: () => ts.factory.createTypeReferenceNode('Uint8Array'),
  // TODO(@HubertBer): Maybe also consider [x, y] type
  [ConvertibleType.CG_POINT]: () =>
    ts.factory.createTypeLiteralNode([
      createPropertySignature({ name: 'x', typeNode: numberKeywordType() }),
      createPropertySignature({ name: 'y', typeNode: numberKeywordType() }),
    ]),
  // TODO(@HubertBer): Maybe also consider the array version
  [ConvertibleType.CG_SIZE]: () =>
    ts.factory.createTypeLiteralNode([
      createPropertySignature({ name: 'width', typeNode: numberKeywordType() }),
      createPropertySignature({ name: 'height', typeNode: numberKeywordType() }),
    ]),
  // TODO(@HubertBer): Maybe also consider the array version
  [ConvertibleType.CG_VECTOR]: () =>
    ts.factory.createTypeLiteralNode([
      createPropertySignature({ name: 'dx', typeNode: numberKeywordType() }),
      createPropertySignature({ name: 'dy', typeNode: numberKeywordType() }),
    ]),
  // TODO(@HubertBer): Maybe also consider the array version
  [ConvertibleType.CG_RECT]: () =>
    ts.factory.createTypeLiteralNode([
      createPropertySignature({ name: 'x', typeNode: numberKeywordType() }),
      createPropertySignature({ name: 'y', typeNode: numberKeywordType() }),
      createPropertySignature({ name: 'width', typeNode: numberKeywordType() }),
      createPropertySignature({ name: 'height', typeNode: numberKeywordType() }),
    ]),
  [ConvertibleType.JS_FUNCTION]: () => createAnyFunctionTypeNode({ returnType: anyKeywordType() }),
  [ConvertibleType.SHARED_REF]: () =>
    ts.factory.createTypeReferenceNode('SharedRef', [anyKeywordType()]),
};

function mapConvertibleTypeToTypeNode(convertibleType: ConvertibleType): ts.TypeNode {
  return CONVERTIBLE_TYPE_MAP[convertibleType]();
}

export function mapTypeToTsTypeNode(type: Type): ts.TypeNode {
  switch (type.kind) {
    case TypeKind.BASIC:
      return mapBasicTypeToTypeNode(type.type as BasicType);
    case TypeKind.CONVERTIBLE:
      return mapConvertibleTypeToTypeNode(type.type as ConvertibleType);
    case TypeKind.IDENTIFIER:
      return ts.factory.createTypeReferenceNode(type.type as string);
    case TypeKind.SUM:
      return ts.factory.createUnionTypeNode((type.type as SumType).types.map(mapTypeToTsTypeNode));
    case TypeKind.ARRAY:
      return ts.factory.createArrayTypeNode(mapTypeToTsTypeNode(type.type as ArrayType));
    case TypeKind.DICTIONARY: {
      const dictionaryType = type.type as DictionaryType;
      const name = 'key';
      const typeNode = mapTypeToTsTypeNode(dictionaryType.key);
      const valueType = mapTypeToTsTypeNode(dictionaryType.value);
      return ts.factory.createTypeLiteralNode([
        ts.factory.createIndexSignature(
          undefined,
          [createParameter({ name, type: typeNode })],
          valueType
        ),
      ]);
    }
    // Technically this one should only be the top one and it should be handled somewhere else
    // for example when creating argument adding the '?' token.
    case TypeKind.OPTIONAL:
      return ts.factory.createUnionTypeNode([
        mapTypeToTsTypeNode(type.type as Type),
        mapBasicTypeToTypeNode(BasicType.NULL),
      ]);
    case TypeKind.PARAMETRIZED:
      return ts.factory.createTypeReferenceNode(
        (type.type as ParametrizedType).name,
        (type.type as ParametrizedType).types.map(mapTypeToTsTypeNode)
      );
  }
  return mapBasicTypeToTypeNode(BasicType.UNRESOLVED);
}

//
// ts.factory wrapper functions
//

function createImportDeclaration({
  defaultImportName,
  namedImportsNames,
  namedTypeImportsNames,
  importFromName,
  typeImport,
}: {
  defaultImportName?: string;
  namedImportsNames?: string[];
  namedTypeImportsNames?: string[];
  importFromName: string;
  typeImport?: boolean;
}): ts.Node[] {
  const hasDefault = !!defaultImportName;
  const hasNamed =
    (namedImportsNames && namedImportsNames.length > 0) ||
    (namedTypeImportsNames && namedTypeImportsNames.length > 0);

  if (!hasDefault && !hasNamed) {
    return [];
  }

  const defaultImport = hasDefault ? ts.factory.createIdentifier(defaultImportName) : undefined;

  const namedImports = hasNamed
    ? ts.factory.createNamedImports([
        ...(namedTypeImportsNames ?? []).map((name) =>
          ts.factory.createImportSpecifier(true, undefined, ts.factory.createIdentifier(name))
        ),
        ...(namedImportsNames ?? []).map((name) =>
          ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier(name))
        ),
      ])
    : undefined;

  return [
    ts.factory.createImportDeclaration(
      undefined,
      ts.factory.createImportClause(
        typeImport ? ts.SyntaxKind.TypeKeyword : undefined,
        defaultImport,
        namedImports
      ),
      ts.factory.createStringLiteral(importFromName)
    ),
  ];
}

function createParameter({
  modifiers,
  name,
  type,
  questionToken,
  dotDotDotToken,
  initializer,
}: {
  modifiers?: ts.Modifier[];
  name: string | ts.BindingName;
  type?: ts.TypeNode;
  questionToken?: ts.QuestionToken;
  dotDotDotToken?: ts.DotDotDotToken;
  initializer?: ts.Expression;
}): ts.ParameterDeclaration {
  return ts.factory.createParameterDeclaration(
    modifiers,
    dotDotDotToken,
    name,
    questionToken,
    type,
    initializer
  );
}

function createProperty({
  modifiers,
  name,
  typeNode,
  initializer,
  optional,
}: {
  modifiers?: ts.Modifier[];
  name: string | ts.PropertyName;
  typeNode?: ts.TypeNode;
  initializer?: ts.Expression;
  optional?: boolean;
}): ts.PropertyDeclaration {
  return ts.factory.createPropertyDeclaration(
    modifiers,
    name,
    optional ? ts.factory.createToken(ts.SyntaxKind.QuestionToken) : undefined,
    typeNode,
    initializer
  );
}

function createPropertySignature({
  name,
  typeNode,
  optional,
  modifiers,
}: {
  name: string | ts.PropertyName;
  typeNode?: ts.TypeNode;
  optional?: boolean;
  modifiers?: ts.Modifier[];
}): ts.PropertySignature {
  return ts.factory.createPropertySignature(
    modifiers,
    name,
    optional ? ts.factory.createToken(ts.SyntaxKind.QuestionToken) : undefined,
    typeNode
  );
}

function createCall({
  expression,
  args,
  typeArgs,
}: {
  expression: string | ts.Expression;
  args?: ts.Expression[];
  typeArgs?: ts.TypeNode[];
}): ts.CallExpression {
  return ts.factory.createCallExpression(
    typeof expression === 'string' ? ts.factory.createIdentifier(expression) : expression,
    typeArgs,
    args
  );
}

function createRequireNativeModuleExpression({
  moduleType,
  moduleName,
}: {
  moduleType?: string;
  moduleName: string;
}) {
  return ts.factory.createCallExpression(
    ts.factory.createIdentifier('requireNativeModule'),
    moduleType ? [ts.factory.createTypeReferenceNode(moduleType)] : undefined,
    [ts.factory.createStringLiteral(moduleName)]
  );
}

function createExportDefaultAsDeclaration({
  exportAsName,
  importFromName,
}: {
  exportAsName: string;
  importFromName: string;
}): ts.Node[] {
  return [
    ts.factory.createExportDeclaration(
      undefined,
      false,
      ts.factory.createNamedExports([
        ts.factory.createExportSpecifier(
          false,
          ts.factory.createIdentifier('default'),
          ts.factory.createIdentifier(exportAsName)
        ),
      ]),
      ts.factory.createStringLiteral(importFromName)
    ),
  ];
}

function createTypeAlias({
  exported,
  alias,
  typeParams,
  type,
}: {
  exported?: boolean;
  alias: string;
  typeParams?: ts.TypeParameterDeclaration[];
  type: ts.TypeNode;
}) {
  return ts.factory.createTypeAliasDeclaration(
    constructModifiersArray({ exported }),
    alias,
    typeParams,
    type
  );
}

function createRequireNativeViewDeclaration(module: ModuleClassDeclaration, view: ViewDeclaration) {
  return [
    createParameter({
      modifiers: [constModifier()],
      name: view.name,
      initializer: createCall({
        expression: 'requireNativeView',
        typeArgs: [ts.factory.createTypeReferenceNode(getViewPropsTypeName(view))],
        args: [
          ts.factory.createStringLiteral(module.name),
          ts.factory.createStringLiteral(view.name),
        ],
      }),
    }),
  ];
}

function createExportAllDeclaration({
  importFromName,
  justTypes,
}: {
  importFromName: string;
  justTypes?: boolean;
}): ts.Node[] {
  return [
    ts.factory.createExportDeclaration(
      undefined,
      justTypes ?? false,
      undefined,
      ts.factory.createStringLiteral(importFromName)
    ),
  ];
}

function createExportDefault(name: string = '_default'): ts.Node[] {
  return [ts.factory.createExportDefault(ts.factory.createIdentifier(name))];
}

function createComponentType(propsTypeName: string) {
  return ts.factory.createTypeReferenceNode('React.JSXElementConstructor', [
    ts.factory.createTypeReferenceNode(propsTypeName),
  ]);
}

function createExtendsClause(className: string, typeArg?: string) {
  return ts.factory.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [
    ts.factory.createExpressionWithTypeArguments(
      ts.factory.createIdentifier(className),
      typeArg ? [ts.factory.createTypeReferenceNode(typeArg)] : undefined
    ),
  ]);
}

function getMissingTypeIdentifiers(fileTypeInformation: FileTypeInformation): Set<string> {
  return fileTypeInformation.usedTypeIdentifiers
    .difference(fileTypeInformation.declaredTypeIdentifiers)
    .difference(getBasicTypesIdentifiers());
}

function buildPropsMembers({ props, events }: ViewDeclaration): ts.TypeElement[] {
  const buildEventPropertySignature = (eventDeclaration: EventDeclaration) => {
    const name = eventDeclaration;
    const typeNode = ts.factory.createFunctionTypeNode(
      undefined,
      [createParameter({ name: 'event', type: anyKeywordType() })],
      voidKeywordType()
    );
    // TODO(@HubertBer) check whether we have ways of making events not optional
    return createPropertySignature({ name, typeNode, optional: true });
  };

  const buildPropPropertySignature = (propDeclaration: PropDeclaration) => {
    const propTypeArgument = propDeclaration.arguments[1]?.type;
    if (!propDeclaration || !propDeclaration.arguments || !propTypeArgument) {
      return undefined;
    }
    const name = propDeclaration.name;
    const optional = propTypeArgument.kind === TypeKind.OPTIONAL;
    const typeNode = mapTypeToTsTypeNode(
      optional ? (propTypeArgument.type as Type) : propTypeArgument
    );
    return createPropertySignature({ name, optional, typeNode });
  };

  return [
    ...(props.map(buildPropPropertySignature).filter((p) => p) as ts.PropertySignature[]),
    ...events.map(buildEventPropertySignature),
  ];
}

export function buildViewPropsInterface(
  view: ViewDeclaration | null,
  options: { exported?: boolean }
): ts.Node[] {
  if (!view) {
    return [];
  }
  return [
    ts.factory.createInterfaceDeclaration(
      constructModifiersArray(options),
      getViewPropsTypeName(view),
      undefined,
      [createExtendsClause('ViewProps')],
      buildPropsMembers(view)
    ),
  ];
}

function buildClassProperty(declaration: PropertyDeclaration): ts.PropertyDeclaration {
  return createProperty({
    modifiers: [readonlyModifier()],
    name: declaration.name,
    typeNode: mapTypeToTsTypeNode(declaration.type),
  });
}

function getEventsTypeName(moduleClassDeclaration: DeclarationWithEvents): string | undefined {
  if (moduleClassDeclaration.events.length > 0) {
    return `${moduleClassDeclaration.name}Events`;
  }
  return undefined;
}

function buildNativeModuleClassDeclaration({
  moduleClassDeclaration,
  exportedModuleName,
}: {
  moduleClassDeclaration: ModuleClassDeclaration;
  exportedModuleName?: string;
}): ts.Node[] {
  const buildClassTypeProperty = (classDeclaration: ClassDeclaration) =>
    createProperty({
      // TODO(@HubertBer): that's a hack, but I couldn't find a proper way to do this
      // The problem is that declare class semantics seem somewhat different than class semantics.
      name: classDeclaration.name,
      typeNode: ts.factory.createTypeQueryNode(ts.factory.createIdentifier(classDeclaration.name)),
    });

  const buildSyncMethod = (functionDeclaration: FunctionDeclaration): ts.MethodDeclaration =>
    buildFunction({
      functionDeclaration,
      method: true,
      declaration: true,
    }) as ts.MethodDeclaration;

  const buildAsyncMethod = (functionDeclaration: FunctionDeclaration): ts.MethodDeclaration =>
    buildFunction({
      functionDeclaration,
      async: true,
      method: true,
      declaration: true,
    }) as ts.MethodDeclaration;

  const moduleEventsName = getEventsTypeName(moduleClassDeclaration);
  return [
    ts.factory.createClassDeclaration(
      [exportModifier(), declareModifier()],
      exportedModuleName ?? `${moduleClassDeclaration.name}NativeModuleType`,
      undefined,
      [createExtendsClause('NativeModule', moduleEventsName)],
      [
        ...moduleClassDeclaration.constants.map(buildClassProperty),
        ...moduleClassDeclaration.properties.map(buildClassProperty),
        ...moduleClassDeclaration.functions.map(buildSyncMethod),
        ...moduleClassDeclaration.asyncFunctions.map(buildAsyncMethod),
        ...moduleClassDeclaration.classes.map(buildClassTypeProperty),
      ]
    ),
  ];
}

// Index of the first argument in the trailing run of optionals.
function firstTrailingOptionalIndex(args: Argument[]): number {
  let index = args.length;
  while (index > 0 && args[index - 1]!.type.kind === TypeKind.OPTIONAL) {
    index -= 1;
  }
  return index;
}

function buildArgumentDeclarationAndName(
  arg: Argument,
  isTrailingOptional: boolean
): {
  argDeclaration: ts.ParameterDeclaration;
  argName: string;
} {
  const argName = arg.name ?? '_' + getNextFreeId();
  const useQuestionToken = isTrailingOptional && arg.type.kind === TypeKind.OPTIONAL;
  const argDeclaration = createParameter({
    name: argName,
    questionToken: useQuestionToken
      ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
      : undefined,

    type: useQuestionToken
      ? // The type is optional, need to get to its inner type.
        mapTypeToTsTypeNode(arg.type.type as Type)
      : mapTypeToTsTypeNode(arg.type),
  });
  return { argDeclaration, argName };
}

function buildArgumentDeclarations(args: Argument[]): ts.ParameterDeclaration[] {
  const trailingOptionalsStart = firstTrailingOptionalIndex(args);
  return args.map(
    (arg, index) =>
      buildArgumentDeclarationAndName(arg, index >= trailingOptionalsStart).argDeclaration
  );
}

export type buildFunctionOptions = {
  functionDeclaration: FunctionDeclaration;
  async?: boolean;
  method?: boolean;
  exported?: boolean;
  declaration?: boolean;
  returnStatement?: null | ts.Statement[];
  overrideArgumentDeclarations?: ts.ParameterDeclaration[];
  omitReturnType?: boolean;
};

export function buildFunction({
  functionDeclaration,
  async,
  method,
  exported,
  declaration,
  returnStatement,
  overrideArgumentDeclarations,
  omitReturnType,
}: buildFunctionOptions): ts.FunctionDeclaration | ts.MethodDeclaration {
  const functionModifiers = constructModifiersArray({
    exported,
    async: async && !declaration,
    isStatic: functionDeclaration.isStatic,
  });
  const customReturn = !!returnStatement;
  const bareReturnTypeNode = mapTypeToTsTypeNode(functionDeclaration.returnType);

  const wrapWithPromiseType = (typeNode: ts.TypeNode): ts.TypeNode =>
    ts.factory.createTypeReferenceNode('Promise', [typeNode]);

  let returnTypeNode: ts.TypeNode | undefined = async
    ? wrapWithPromiseType(bareReturnTypeNode)
    : bareReturnTypeNode;
  if (omitReturnType) {
    returnTypeNode = undefined;
  }
  const argumentDeclarations =
    overrideArgumentDeclarations ?? buildArgumentDeclarations(functionDeclaration.arguments);

  if (method) {
    return ts.factory.createMethodDeclaration(
      functionModifiers,
      undefined,
      functionDeclaration.name,
      undefined,
      undefined,
      argumentDeclarations,
      returnTypeNode,
      declaration ? undefined : ts.factory.createBlock(customReturn ? returnStatement : [])
    );
  }
  return ts.factory.createFunctionDeclaration(
    functionModifiers,
    undefined,
    functionDeclaration.name,
    undefined,
    argumentDeclarations,
    returnTypeNode,
    declaration ? undefined : ts.factory.createBlock(customReturn ? returnStatement : [])
  );
}

export function buildConstructor(
  constructor: ConstructorDeclaration,
  declaration: boolean
): ts.ClassElement {
  return ts.factory.createConstructorDeclaration(
    undefined,
    buildArgumentDeclarations(constructor.arguments),
    declaration ? undefined : ts.factory.createBlock([])
  );
}

type BuildClassOptions = {
  classDeclaration: ClassDeclaration;
  exported?: boolean;
  declaration?: boolean;
  getFunctionReturnBlock?: (functionDeclaration: FunctionDeclaration) => ts.Statement[];
};

// TODO(@HubertBer): figure out what about inheritance, should or should not inherit SharedObject
export function buildClass({
  classDeclaration,
  exported,
  declaration,
  getFunctionReturnBlock,
}: BuildClassOptions): ts.ClassDeclaration {
  const getReturnStatement = (method: FunctionDeclaration) =>
    !declaration && getFunctionReturnBlock ? getFunctionReturnBlock(method) : null;

  const buildMethod = (method: FunctionDeclaration, async?: boolean) =>
    buildFunction({
      functionDeclaration: method,
      method: true,
      async,
      declaration,
      returnStatement: getReturnStatement(method),
    }) as ts.MethodDeclaration;

  const classMembers = [
    ...classDeclaration.methods.map((m) => buildMethod(m)),
    ...classDeclaration.asyncMethods.map((m) => buildMethod(m, true)),
    ...(declaration ? classDeclaration.properties.map(buildClassProperty) : []),
    classDeclaration.constructor
      ? buildConstructor(classDeclaration.constructor, declaration ?? false)
      : undefined,
  ].filter((x) => x !== undefined);

  const extendClause = declaration
    ? [createExtendsClause('SharedObject', getEventsTypeName(classDeclaration))]
    : [];
  return ts.factory.createClassDeclaration(
    constructModifiersArray({ exported, declare: declaration }),
    ts.factory.createIdentifier(classDeclaration.name),
    undefined,
    extendClause,
    classMembers
  );
}

function buildModuleDefaultExport({
  moduleName,
  moduleType,
  declaration,
}: {
  moduleName: string;
  moduleType?: string;
  declaration?: boolean;
}): ts.Node[] {
  const name = '_default';
  const type = moduleType ? ts.factory.createTypeReferenceNode(moduleType) : undefined;
  return [
    createParameter({
      modifiers: [constModifier()],
      name,
      type,
      initializer: declaration
        ? undefined
        : createRequireNativeModuleExpression({ moduleName, moduleType }),
    }),
    ts.factory.createExportDefault(ts.factory.createIdentifier('_default')),
  ];
}

export function buildUnknownTypeAlias(
  identifier: string,
  exported: boolean,
  inferredTypeParametersCount: Map<string, number>
): ts.Statement {
  const paramCount = inferredTypeParametersCount.get(identifier);
  const typeParamsList = [];
  for (let i = 0; i < (paramCount ?? 0); i += 1) {
    typeParamsList.push(ts.factory.createTypeParameterDeclaration(undefined, 'T' + i));
  }
  const typeParams = (paramCount ?? 0) === 0 ? undefined : typeParamsList;
  return createTypeAlias({ exported, alias: identifier, type: unknownKeywordType(), typeParams });
}

export function buildRecordTypeAlias(recordType: RecordType, exported: boolean): ts.Node {
  return createTypeAlias({
    exported,
    alias: recordType.name,
    type: ts.factory.createTypeLiteralNode(
      recordType.fields.map((field) => {
        const optional = field.type.kind === TypeKind.OPTIONAL;
        const typeNode = mapTypeToTsTypeNode(optional ? (field.type.type as Type) : field.type);
        const name = field.name ?? '_' + getNextFreeId();
        return createPropertySignature({ name, optional, typeNode });
      })
    ),
  });
}

export function buildEnumTypeDeclaration(
  enumType: EnumType,
  exported: boolean,
  declared: boolean
): ts.Node {
  return ts.factory.createEnumDeclaration(
    constructModifiersArray({ exported, declare: declared }),
    enumType.name,
    enumType.cases.map((enumcase) =>
      ts.factory.createEnumMember(
        enumcase,
        enumType.stringBacked ? ts.factory.createStringLiteral(enumcase) : undefined
      )
    )
  );
}

function buildMissingTypesDeclarations({
  fileInfo,
  missingTypes,
}: {
  fileInfo: FileTypeInformation;
  missingTypes: Set<string>;
}): ts.Node[] {
  if (missingTypes.size === 0) {
    return [];
  }

  const header = ts.addSyntheticLeadingComment(
    ts.factory.createIdentifier(''),
    ts.SyntaxKind.SingleLineCommentTrivia,
    ` These types haven't been defined in provided file(s).`,
    true
  );

  const aliases = [...missingTypes].map((identifier) =>
    buildUnknownTypeAlias(identifier, true, fileInfo.inferredTypeParametersCount)
  );

  return [header, ...aliases];
}

function buildDefaultViewComponent({
  componentName,
  propsTypeAlias,
}: {
  componentName: string;
  propsTypeAlias: string;
}) {
  const jsxElement = ts.factory.createJsxSelfClosingElement(
    ts.factory.createIdentifier(componentName),
    undefined,
    ts.factory.createJsxAttributes([
      ts.factory.createJsxSpreadAttribute(ts.factory.createIdentifier('props')),
    ])
  );

  const functionBody = ts.factory.createBlock([ts.factory.createReturnStatement(jsxElement)]);

  return [
    ts.factory.createFunctionExpression(
      [exportModifier(), defaultModifier()],
      undefined,
      componentName + 'Component',
      undefined,
      [
        createParameter({
          name: 'props',
          type: ts.factory.createTypeReferenceNode(propsTypeAlias),
        }),
      ],
      undefined,
      functionBody
    ),
  ];
}

function createFunctionTypeNode({
  args,
  returnType,
}: {
  args: ts.ParameterDeclaration[];
  returnType: ts.TypeNode;
}) {
  return ts.factory.createFunctionTypeNode(undefined, args, returnType);
}

function createAnyFunctionTypeNode({ returnType }: { returnType: ts.TypeNode }) {
  return createFunctionTypeNode({
    args: [
      createParameter({
        dotDotDotToken: ts.factory.createToken(ts.SyntaxKind.DotDotDotToken),
        name: 'args',
        type: ts.factory.createArrayTypeNode(
          ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
        ),
      }),
    ],
    returnType,
  });
}

interface DeclarationWithEvents {
  events: string[];
  name: string;
}

function buildEventsTypeDeclaration(
  moduleClassDeclaration: DeclarationWithEvents,
  { exported, isModule }: { exported?: boolean; isModule?: boolean }
): ts.Node[] {
  const createEventType = () => {
    if (isModule) {
      // Module events are objects i.e. Record<string, any>
      return createFunctionTypeNode({
        args: [
          createParameter({
            name: 'payload',
            type: ts.factory.createTypeReferenceNode('Record', [
              stringKeywordType(),
              anyKeywordType(),
            ]),
          }),
        ],
        returnType: voidKeywordType(),
      });
    }
    // Shared object events can be anything
    return createFunctionTypeNode({
      args: [
        createParameter({
          name: 'payload',
          questionToken: ts.factory.createToken(ts.SyntaxKind.QuestionToken),
          type: anyKeywordType(),
        }),
      ],
      returnType: voidKeywordType(),
    });
  };

  const eventsTypeName = getEventsTypeName(moduleClassDeclaration);
  if (!eventsTypeName) {
    return [];
  }

  return [
    ts.addSyntheticLeadingComment(
      createTypeAlias({
        exported,
        alias: eventsTypeName,
        type: ts.factory.createTypeLiteralNode(
          moduleClassDeclaration.events.map((event) => {
            return createPropertySignature({
              name: ts.factory.createStringLiteral(event),
              typeNode: createEventType(),
            });
          })
        ),
      }),
      ts.SyntaxKind.SingleLineCommentTrivia,
      ` These events may have payloads that weren't resolved!`
    ),
  ];
}

type IdentifiersInfo = {
  usedTypeIdentifiers: Set<string>;
  usedValueIdentifiers: Set<string>;
  declaredTypeIdentifiers: Set<string>;
  declaredValueIdentifiers: Set<string>;
};

// Leftmost identifier of `A.B.C`
function entityNameToString(entityName: ts.EntityName): string {
  return ts.isIdentifier(entityName) ? entityName.text : entityNameToString(entityName.left);
}

function rootOfIdentifier(identifier: ts.Identifier): string | undefined {
  return identifier.text.split('.')[0];
}

function collectIdentifiersFromTSNodes(rootNodes: ts.Node[]): IdentifiersInfo {
  const usedTypeIdentifiers = new Set<string>();
  const usedValueIdentifiers = new Set<string>();
  const declaredTypeIdentifiers = new Set<string>();
  const declaredValueIdentifiers = new Set<string>();

  const addHeritageIdentifiers = (
    node: ts.InterfaceDeclaration | ts.ClassDeclaration,
    identifiers: Set<string>
  ) => {
    for (const clause of node.heritageClauses ?? []) {
      for (const typeExpression of clause.types) {
        if (ts.isIdentifier(typeExpression.expression)) {
          identifiers.add(typeExpression.expression.text);
        }
      }
    }
  };

  const visit = (node: ts.Node) => {
    // Only handle the used identifiers in here, as the declarations are always in the root nodes.
    if (ts.isTypeReferenceNode(node)) {
      // handle any type reference e.g. `a: TestEnum`, `Promise<T>`, `Some.Qualified.Type`.
      usedTypeIdentifiers.add(entityNameToString(node.typeName));
    } else if (ts.isTypeQueryNode(node)) {
      // handle `typeof some.value`.
      usedValueIdentifiers.add(entityNameToString(node.exprName));
    } else if (ts.isInterfaceDeclaration(node)) {
      // `interface Props extends ViewProps` uses the heritage name only as a type.
      addHeritageIdentifiers(node, usedTypeIdentifiers);
    } else if (ts.isClassDeclaration(node)) {
      // `class X extends SharedObject` needs the heritage name as a value, even on `declare class`.
      addHeritageIdentifiers(node, usedValueIdentifiers);
    } else if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      // handle the call expressions `someFunction(arg1, arg2)`.
      const identifierRoot = rootOfIdentifier(node.expression);
      if (identifierRoot) {
        usedValueIdentifiers.add(identifierRoot);
      }
    } else if (ts.isJsxSelfClosingElement(node) && ts.isIdentifier(node.tagName)) {
      // handle `<SomeView />`.
      usedValueIdentifiers.add(node.tagName.text);
    } else if (
      (ts.isPropertyDeclaration(node) || ts.isParameter(node)) &&
      node.initializer &&
      ts.isIdentifier(node.initializer)
    ) {
      // handle declaration initializers that are a bare identifier,
      // e.g. the top-level const hack `export const StringConstant = TestModule.StringConstant`.
      const identifierRoot = rootOfIdentifier(node.initializer);
      if (identifierRoot) {
        usedValueIdentifiers.add(identifierRoot);
      }
    }

    ts.forEachChild(node, visit);
  };

  for (const node of rootNodes) {
    if (ts.isIdentifier(node)) {
      continue;
    }

    const isTypeDeclaration =
      (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) && node.name;
    const isTypicalValueDeclaration =
      (ts.isClassDeclaration(node) ||
        ts.isEnumDeclaration(node) ||
        ts.isFunctionDeclaration(node)) &&
      node.name;
    const isConstDeclaration = ts.isParameter(node) && ts.isIdentifier(node.name);

    if (isTypeDeclaration) {
      declaredTypeIdentifiers.add(node.name.text);
    } else if (isTypicalValueDeclaration) {
      declaredValueIdentifiers.add(node.name.text);
    } else if (isConstDeclaration) {
      // TypeScript moment. This can't be merged with the previous branch.
      declaredValueIdentifiers.add(node.name.text);
    }
    visit(node);
  }

  for (const v of usedValueIdentifiers) {
    usedTypeIdentifiers.delete(v);
  }

  return {
    usedTypeIdentifiers,
    usedValueIdentifiers,
    declaredTypeIdentifiers,
    declaredValueIdentifiers,
  };
}

type IdentifierDeclarationImportMap = Map<string, string>;

function baseIdentifierFileMap(): IdentifierDeclarationImportMap {
  return new Map([
    ['ColorValue', 'react-native'],
    ['ViewProps', 'react-native'],
    ['SharedObject', 'expo'],
    ['requireNativeView', 'expo'],
    ['requireNativeModule', 'expo'],
    ['NativeModule', 'expo'],
    ['SharedRef', 'expo'],
  ]);
}

// Ambient in any TS program, never imported.
const GLOBAL_IDENTIFIERS = new Set<string>(['Uint8Array', 'Map', 'Set', 'Promise', 'Record']);

function createIdentifierFileMapping(
  fileIdentifiersInfo: { identifiersInfo: IdentifiersInfo; importPath: string }[]
): IdentifierDeclarationImportMap {
  const declarationMap: IdentifierDeclarationImportMap = baseIdentifierFileMap();

  for (const { identifiersInfo, importPath } of fileIdentifiersInfo) {
    for (const typeIdentifier of identifiersInfo.declaredTypeIdentifiers) {
      declarationMap.set(typeIdentifier, importPath);
    }
    for (const valueIdentifier of identifiersInfo.declaredValueIdentifiers) {
      declarationMap.set(valueIdentifier, importPath);
    }
  }
  return declarationMap;
}

function createImportNodes(
  {
    usedTypeIdentifiers,
    usedValueIdentifiers,
    declaredTypeIdentifiers,
    declaredValueIdentifiers,
  }: IdentifiersInfo,
  identifierDeclarationImportMap: IdentifierDeclarationImportMap
): ts.Node[] {
  const valueIdentifiersImportGroup = {
    identifiersToImport: usedValueIdentifiers
      .difference(declaredValueIdentifiers)
      .difference(declaredTypeIdentifiers)
      .difference(GLOBAL_IDENTIFIERS),
    importsSet: new Map<string, string[]>(),
    typeImport: false,
  };
  const typeIdentifiersImportGroup = {
    identifiersToImport: usedTypeIdentifiers
      .difference(declaredTypeIdentifiers)
      .difference(declaredValueIdentifiers)
      .difference(GLOBAL_IDENTIFIERS)
      .difference(valueIdentifiersImportGroup.identifiersToImport),
    importsSet: new Map<string, string[]>(),
    typeImport: true,
  };
  const importGroups = [typeIdentifiersImportGroup, valueIdentifiersImportGroup];

  for (const { identifiersToImport, importsSet } of importGroups) {
    for (const typeIdent of identifiersToImport) {
      const importPath = identifierDeclarationImportMap.get(typeIdent);
      if (!importPath) {
        console.warn(`No known declaration of ${typeIdent}.`);
        continue;
      }
      if (!importsSet.has(importPath)) {
        importsSet.set(importPath, []);
      }
      importsSet.get(importPath)?.push(typeIdent);
    }
  }

  const importNodes: ts.Node[][] = [];
  for (const { importsSet, typeImport } of importGroups) {
    for (const [importFromName, typeIdentifiers] of importsSet) {
      importNodes.push(
        createImportDeclaration({
          namedImportsNames: typeIdentifiers,
          importFromName,
          typeImport,
        })
      );
    }
  }

  return importNodes.flat(1);
}

export function buildExposedCommonTypesDeclarations(
  { fileInfo, missingTypes }: { fileInfo: FileTypeInformation; missingTypes: Set<string> },
  options: { exported?: boolean; declare?: boolean }
): ts.Node[] {
  const recordDeclarationMap = (recordType: RecordType) =>
    buildRecordTypeAlias(recordType, options.exported ?? false);
  const enumDeclarationMap = (enumType: EnumType) =>
    buildEnumTypeDeclaration(enumType, options.exported ?? false, options.declare ?? false);

  return joinTSNodesWithNewlines([
    buildMissingTypesDeclarations({ fileInfo, missingTypes }),
    fileInfo.records.flatMap(recordDeclarationMap),
    fileInfo.enums.flatMap(enumDeclarationMap),
  ]);
}

export function buildExposedModuleTypesDeclarations(
  ctx: GenerationContext,
  options: { exported?: boolean; declare?: boolean }
): ts.Node[] {
  const classDeclarationMap = (classDeclaration: ClassDeclaration) => {
    const eventsTypeNodes =
      classDeclaration.events.length > 0
        ? buildEventsTypeDeclaration(classDeclaration, options)
        : [];
    const classDeclarationNode = buildClass({
      classDeclaration,
      exported: true,
      declaration: true,
    });

    return [...eventsTypeNodes, classDeclarationNode];
  };

  return joinTSNodesWithNewlines([
    ...ctx.module.classes.map(classDeclarationMap),
    buildEventsTypeDeclaration(ctx.module, { ...options, isModule: true }),
  ]);
}

export function buildExposedTypesDeclarations(
  ctx: GenerationContext,
  options: { exported?: boolean; declare?: boolean; imports?: boolean }
): ts.Node[] {
  const returnNodes = options.imports
    ? createImportDeclaration({
        namedImportsNames: ['NativeModule', 'SharedObject'],
        importFromName: 'expo',
      })
    : [];
  return [
    ...returnNodes,
    ...buildExposedCommonTypesDeclarations(ctx, options),
    ...buildExposedModuleTypesDeclarations(ctx, options),
  ];
}

function buildModuleDeclarationNodes(ctx: GenerationContext): ts.Node[] {
  return joinTSNodesWithNewlines([
    buildExposedTypesDeclarations(ctx, { exported: true, imports: true }),
    buildNativeModuleClassDeclaration({ moduleClassDeclaration: ctx.module }),
    buildModuleDefaultExport({
      moduleName: ctx.module.name,
      moduleType: ctx.module.name,
      declaration: true,
    }),
  ] as ts.Node[][]);
}

export function getViewPropsTypeName(view: ViewDeclaration): string {
  return view.name + (view.name.endsWith('View') ? 'Props' : 'ViewProps');
}

function buildViewDeclarationNodes(ctx: GenerationContext): ts.Node[] {
  if (!ctx.view) {
    return [];
  }
  const viewComponentType = createComponentType(getViewPropsTypeName(ctx.view));
  const modifiers = [declareModifier(), constModifier()];
  return joinTSNodesWithNewlines([
    createImportDeclaration({ namedImportsNames: ['ViewProps'], importFromName: 'react-native' }),
    buildMissingTypesDeclarations(ctx),
    buildViewPropsInterface(ctx.view, {}),
    [createParameter({ modifiers, name: '_default', type: viewComponentType })],
    createExportDefault(),
  ]);
}

function buildJSXIntrinsicsViewNodes(ctx: GenerationContext): ts.Node[] {
  const name = ctx.module.name;
  const propsTypeNode = ctx.view
    ? ts.factory.createTypeLiteralNode(buildPropsMembers(ctx.view))
    : undefined;

  const jsxIntrinsicElementsNodes = [];
  if (ctx.view) {
    const globalIdentifier = ts.factory.createIdentifier('global');
    const jsxIdentifier = ts.factory.createIdentifier('JSX');
    const intrinsicElementsIdentifier = ts.factory.createIdentifier('IntrinsicElements');
    jsxIntrinsicElementsNodes.push(
      ts.factory.createModuleDeclaration(
        [declareModifier()],
        globalIdentifier,
        ts.factory.createModuleBlock([
          ts.factory.createModuleDeclaration(
            undefined,
            jsxIdentifier,
            ts.factory.createModuleBlock([
              ts.factory.createInterfaceDeclaration(
                undefined,
                intrinsicElementsIdentifier,
                undefined,
                undefined,
                [createPropertySignature({ name, typeNode: propsTypeNode })]
              ),
            ]),
            ts.NodeFlags.Namespace
          ),
        ]),
        ts.NodeFlags.GlobalAugmentation
      )
    );
  }

  return joinTSNodesWithNewlines([
    buildExposedTypesDeclarations(ctx, { declare: true }),
    jsxIntrinsicElementsNodes,
  ]);
}

function buildNativeModuleGeneratedNodes(ctx: GenerationContext): ts.Node[] {
  return joinTSNodesWithNewlines([
    createImportDeclaration({ namedImportsNames: ['ViewProps'], importFromName: 'react-native' }),
    buildExposedTypesDeclarations(ctx, { exported: true, imports: true }),
    buildViewPropsInterface(ctx.view, { exported: true }),
    buildNativeModuleClassDeclaration({ moduleClassDeclaration: ctx.module }),
  ]);
}

function buildStableNativeModuleInterface(ctx: GenerationContext): ts.Node[] {
  const generatedModuleAlias = ctx.module.name;
  const generatedModuleTypeAlias = `${ctx.module.name}NativeModuleType`;
  const generatedFilePath = `./${ctx.module.name}.generated`;

  const exportedFunctionReturnStatement = (
    functionDeclaration: FunctionDeclaration,
    overrideArguments?: ts.Identifier[]
  ) => {
    const expression = `${generatedModuleAlias}.${functionDeclaration.name}`;
    const args =
      overrideArguments ??
      functionDeclaration.arguments.map((arg) =>
        ts.factory.createIdentifier(arg.name ?? 'unnamedArgument')
      );

    return ts.factory.createReturnStatement(
      createCall({
        expression,
        args,
      })
    );
  };

  const mapFunctionDeclarationTemplate =
    (isAsync: boolean) => (functionDeclaration: FunctionDeclaration) => {
      const argumentDeclarations = [];
      const argumentNames = [];
      const trailingOptionalsStart = firstTrailingOptionalIndex(functionDeclaration.arguments);
      for (const [index, arg] of functionDeclaration.arguments.entries()) {
        const { argDeclaration, argName } = buildArgumentDeclarationAndName(
          arg,
          index >= trailingOptionalsStart
        );
        argumentDeclarations.push(argDeclaration);
        argumentNames.push(argName);
      }
      return [
        buildFunction({
          functionDeclaration,
          async: isAsync,
          exported: true,
          returnStatement: [
            exportedFunctionReturnStatement(
              functionDeclaration,
              argumentNames.map(ts.factory.createIdentifier)
            ),
          ],
          overrideArgumentDeclarations: argumentDeclarations,
          omitReturnType: true,
        }),
      ];
    };

  const mapSyncFunctionDeclaration = mapFunctionDeclarationTemplate(false);
  const mapAsyncFunctionDeclaration = mapFunctionDeclarationTemplate(true);
  const buildConstantExportProperty = (constant: ConstantDeclaration): ts.Node => {
    const typeNode = mapTypeToTsTypeNode(constant.type);
    const modifiers = [exportModifier(), constModifier()];
    const initializer = ts.factory.createIdentifier(`${generatedModuleAlias}.${constant.name}`);
    return createProperty({ modifiers, name: constant.name, typeNode, initializer });
  };

  return joinTSNodesWithNewlines([
    ctx.view
      ? createImportDeclaration({ importFromName: 'react', defaultImportName: 'React' })
      : [],

    createImportDeclaration({
      namedImportsNames: [
        ...ctx.fileInfo.usedTypeIdentifiers.difference(getBasicTypesIdentifiers()),
        ...[
          getEventsTypeName(ctx.module),
          generatedModuleTypeAlias,
          ctx.view ? getViewPropsTypeName(ctx.view) : null,
        ].filter((v) => v !== undefined && v !== null),
      ],
      importFromName: generatedFilePath,
    }),

    createImportDeclaration({
      namedImportsNames: ['requireNativeModule', 'requireNativeView'],
      importFromName: 'expo',
    }),

    [
      createParameter({
        modifiers: [constModifier()],
        name: ctx.module.name,
        type: ts.factory.createTypeReferenceNode(generatedModuleTypeAlias),
        initializer: createRequireNativeModuleExpression({
          moduleName: ctx.module.name,
          moduleType: generatedModuleTypeAlias,
        }),
      }),
    ],

    ctx.view ? createRequireNativeViewDeclaration(ctx.module, ctx.view) : [],

    ctx.module.constants.map(buildConstantExportProperty),

    ctx.module.functions.flatMap(mapSyncFunctionDeclaration),
    ctx.module.asyncFunctions.flatMap(mapAsyncFunctionDeclaration),

    ctx.view
      ? buildDefaultViewComponent({
          componentName: ctx.view.name,
          propsTypeAlias: getViewPropsTypeName(ctx.view),
        })
      : [],
  ]);
}

async function tsNodesToString(elements: ts.Node[]): Promise<string> {
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const resultFile = ts.createSourceFile('', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TSX);
  const viewTypes = ts.factory.createNodeArray(elements);
  const printedTs = printer.printList(
    ts.ListFormat.MultiLine | ts.ListFormat.PreserveLines,
    viewTypes,
    resultFile
  );
  return await prettifyCode(printedTs, 'typescript');
}

/**
 * Helper function that takes a file content string and formats it using `prettier` formatter.
 * @param text Content of a JavaScript/TypeScript file to format.
 * @param parser An option of which parser to use to format the file.
 * @default "babel"
 * @returns A promise which resolves to the `text` string after formatting using `prettier` with the given `parser`.
 * @header TypescriptGeneration
 */
export async function prettifyCode(text: string, parser: 'babel' | 'typescript' = 'babel') {
  return await prettier.format(text, {
    parser,
    tabWidth: 2,
    printWidth: 100,
    trailingComma: 'none',
    singleQuote: true,
  });
}

/**
 * Generates the TypeScript string content for a native View's type declaration file.
 * @param fileTypeInformation The abstracted type information of an Expo module.
 * @returns A promise that resolves to a string containing the TypeScript declaration file content or `null` if the generation has failed.
 * @header TypescriptGeneration
 */
export async function generateViewTypesFileContent(
  fileTypeInformation: FileTypeInformation
): Promise<string | null> {
  const ctx = createDefaultGenerationContext(fileTypeInformation);
  if (!ctx) {
    return null;
  }
  return tsNodesToString(buildViewDeclarationNodes(ctx));
}

/**
 * Generates the TypeScript string content for a native View's type declaration file which mounts the View props on the global `JSXIntrinsics`.
 * @param fileTypeInformation The abstracted type information of an Expo module.
 * @returns A promise that resolves to a string containing the TypeScript declaration file content or `null` if the generation has failed.
 * @header TypescriptGeneration
 */
export async function generateJSXIntrinsicsFileContent(
  fileTypeInformation: FileTypeInformation
): Promise<string | null> {
  const ctx = createDefaultGenerationContext(fileTypeInformation);
  if (!ctx) {
    return null;
  }
  return tsNodesToString(buildJSXIntrinsicsViewNodes(ctx));
}

/**
 * Generates the TypeScript string content for a native module type declaration file.
 * @param fileTypeInformation The abstracted type information of an Expo module.
 * @returns A promise that resolves to a string containing the TypeScript module declaration file content or `null` if the generation has failed.
 * @header TypescriptGeneration
 */
export async function generateModuleTypesFileContent(
  fileTypeInformation: FileTypeInformation
): Promise<string | null> {
  const ctx = createDefaultGenerationContext(fileTypeInformation);
  if (!ctx) {
    return null;
  }
  return tsNodesToString(buildModuleDeclarationNodes(ctx));
}

/**
 * Generates a short TypeScript interface for an Expo module. This creates the content for two files: a volatile generated file containing raw type definitions,
 * and a stable user-facing file that wraps and exports the native module methods in new functions.
 * @param fileTypeInformation The abstracted type information of an Expo module.
 * @returns A promise that resolves to an object containing the string contents for both the volatile generated file and the stable TypeScript interface file.
 * @header TypescriptGeneration
 */
export async function generateConciseTsInterface(
  fileTypeInformation: FileTypeInformation
): Promise<{
  volatileGeneratedFileContent: string;
  moduleTypescriptInterfaceFileContent: string;
}> {
  const ctx = createDefaultGenerationContext(fileTypeInformation);
  if (!ctx) {
    return { volatileGeneratedFileContent: '', moduleTypescriptInterfaceFileContent: '' };
  }

  const volatileGeneratedFileContent = await tsNodesToString(buildNativeModuleGeneratedNodes(ctx));

  const moduleTypescriptInterfaceFileContent = await tsNodesToString(
    buildStableNativeModuleInterface(ctx)
  );

  return {
    volatileGeneratedFileContent,
    moduleTypescriptInterfaceFileContent,
  };
}

type FullModuleTSInterface = {
  moduleName: string;
  moduleTypesFile: OutputFile;
  moduleViewsFiles: OutputFile[];
  moduleNativeFile: OutputFile;
  indexFile: OutputFile;
};

type FullTSInterface = {
  moduleInterfaces: FullModuleTSInterface[];
  commonTypesInterface?: OutputFile;
};

/**
 * Generates a full, multi-file TypeScript interface for an Expo module.
 * The generated interface is separated into a file with type definitions, a file which wraps the native module, a file for each view defined in a module and an index file which reexports all definitions from the other files.
 *
 * @param fileTypeInformation The abstracted type information of an Expo module.
 * @returns A promise that resolves to an object containing the string contents for all of the generated files or `null` if the generation has failed.
 * @header TypescriptGeneration
 */
export async function generateFullTsInterface(
  fileTypeInformation: FileTypeInformation
): Promise<FullTSInterface> {
  const commonTypesNodes = buildExposedCommonTypesDeclarations(
    {
      fileInfo: fileTypeInformation,
      missingTypes: getMissingTypeIdentifiers(fileTypeInformation),
    },
    { exported: true }
  );
  const commonTypesIdentifiers = {
    identifiersInfo: collectIdentifiersFromTSNodes(commonTypesNodes),
    importPath: './Common.types',
  };
  const moduleInterfaces = [];
  for (const moduleClassDeclaration of fileTypeInformation.moduleClasses) {
    const ctx = createGenerationContext(fileTypeInformation, moduleClassDeclaration);
    const moduleNativeFileImportName = `${ctx?.module.name}Module`;
    const moduleTypesFileImportName = `${ctx?.module.name}.types`;
    const moduleViewsFilesImportNames: string[] = [];

    let moduleTypesFileNodes: ts.Node[];
    if (fileTypeInformation.moduleClasses.length <= 1) {
      moduleTypesFileNodes = joinTSNodesWithNewlines([
        buildExposedTypesDeclarations(ctx, { exported: true }),
        ...ctx.module.views.map((view) => buildViewPropsInterface(view, { exported: true })),
      ]);
    } else {
      moduleTypesFileNodes = joinTSNodesWithNewlines([
        buildExposedModuleTypesDeclarations(ctx, { exported: true }),
        ...ctx.module.views.map((view) => buildViewPropsInterface(view, { exported: true })),
      ]);
    }
    const typesFileIdentifiers = {
      identifiersInfo: collectIdentifiersFromTSNodes(moduleTypesFileNodes),
      importPath: `./${moduleTypesFileImportName}`,
    };

    const moduleViewFilesNodes: ts.Node[][] = [];
    const viewFilesIdentifiers = [];
    for (const view of ctx.module.views) {
      const moduleViewFileNodes = joinTSNodesWithNewlines([
        createRequireNativeViewDeclaration(ctx.module, view),
        buildDefaultViewComponent({
          componentName: view.name,
          propsTypeAlias: getViewPropsTypeName(view),
        }),
      ]);
      moduleViewFilesNodes.push(moduleViewFileNodes);
      moduleViewsFilesImportNames.push(`${view.name}View`);
      viewFilesIdentifiers.push({
        identifiersInfo: collectIdentifiersFromTSNodes(moduleViewFileNodes),
        importPath: `./${view.name}View`,
      });
    }

    let moduleNativeModuleNodes: ts.Node[] = joinTSNodesWithNewlines([
      buildNativeModuleClassDeclaration({
        moduleClassDeclaration: ctx.module,
        exportedModuleName: ctx.module.name,
      }),
      buildModuleDefaultExport({ moduleName: ctx.module.name, moduleType: ctx.module.name }),
    ]);
    const moduleFileIdentifiers = {
      identifiersInfo: collectIdentifiersFromTSNodes(moduleNativeModuleNodes),
      importPath: `./${moduleNativeFileImportName}`,
    };

    const indexFileNodes = joinTSNodesWithNewlines(
      [
        moduleTypesFileNodes.length > 0
          ? createExportAllDeclaration({
              importFromName: `./${moduleTypesFileImportName}`,
              justTypes: false,
            })
          : null,
        createExportDefaultAsDeclaration({
          exportAsName: ctx.module.name,
          importFromName: `./${moduleNativeFileImportName}`,
        }),

        ...ctx.module.views.map((view, idx) =>
          createExportDefaultAsDeclaration({
            exportAsName: view.name,
            importFromName: `./${moduleViewsFilesImportNames[idx]}`,
          })
        ),
      ].filter((v) => v !== null)
    );

    const identifierFileMap = createIdentifierFileMapping([
      commonTypesIdentifiers,
      typesFileIdentifiers,
      moduleFileIdentifiers,
      ...viewFilesIdentifiers,
    ]);

    moduleTypesFileNodes = [
      ...createImportNodes(typesFileIdentifiers.identifiersInfo, identifierFileMap),
      ...moduleTypesFileNodes,
    ];

    moduleNativeModuleNodes = [
      ...createImportNodes(moduleFileIdentifiers.identifiersInfo, identifierFileMap),
      ...moduleNativeModuleNodes,
    ];

    for (let i = 0; i < moduleViewFilesNodes.length; i += 1) {
      moduleViewFilesNodes[i] = [
        ...createImportNodes(viewFilesIdentifiers[i]!.identifiersInfo, identifierFileMap),
        ...moduleViewFilesNodes[i]!,
      ];
    }

    const [
      moduleTypesFileContent,
      moduleViewFilesContents,
      moduleNativeFileContent,
      indexFileContent,
    ] = await Promise.all([
      tsNodesToString(moduleTypesFileNodes),
      Promise.all(moduleViewFilesNodes.map(tsNodesToString)),
      tsNodesToString(moduleNativeModuleNodes),
      tsNodesToString(indexFileNodes),
    ]);

    const moduleTypesFile = {
      content: moduleTypesFileContent,
      name: `${moduleTypesFileImportName}.ts`,
    };
    const moduleViewsFiles = moduleViewFilesContents.map((moduleViewFileContent, idx) => {
      return {
        content: moduleViewFileContent,
        name: `${moduleViewsFilesImportNames[idx]}.tsx`,
      };
    });
    const moduleNativeFile = {
      content: moduleNativeFileContent,
      name: `${moduleNativeFileImportName}.ts`,
    };
    const indexFile = { content: indexFileContent, name: `index.ts` };
    moduleInterfaces.push({
      moduleName: moduleClassDeclaration.name,
      moduleTypesFile,
      moduleViewsFiles,
      moduleNativeFile,
      indexFile,
    });
  }

  if (fileTypeInformation.moduleClasses.length <= 1) {
    return { moduleInterfaces, commonTypesInterface: undefined };
  }
  const commonTypesContent = await tsNodesToString(commonTypesNodes);
  const commonTypesInterface: OutputFile = {
    name: 'Common.types.ts',
    content: commonTypesContent,
  };
  return { moduleInterfaces, commonTypesInterface };
}
