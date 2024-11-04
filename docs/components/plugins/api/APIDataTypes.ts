import { TypeDocKind } from './APISectionUtils';

// Generic data type

export type GeneratedData = EnumDefinitionData &
  MethodDefinitionData &
  PropsDefinitionData &
  DefaultPropsDefinitionData &
  TypeGeneralData &
  InterfaceDefinitionData &
  ConstantDefinitionData &
  ClassDefinitionData;

// Shared data types

export type CommentData = {
  summary: CommentContentData[];
  returns?: string;
  blockTags?: CommentTagData[];
  modifierTags?: string[];
};

export type CommentTagData = {
  tag: string;
  content: CommentContentData[];
};

export type CommentContentData = {
  kind: string;
  text: string;
  tag?: string;
  tsLinkText?: string;
};

export type TypeDefinitionData = {
  name?: string;
  type: string;
  types?: TypeDefinitionData[];
  element?: {
    name: string;
    type: string;
  };
  elements?: TypeDefinitionData[];
  elementType?: {
    name?: string;
    type: string;
    types?: TypeDefinitionData[];
    declaration?: TypeDeclarationContentData;
  };
  queryType?: {
    name: string;
    type: string;
  };
  typeArguments?: TypeDefinitionData[];
  checkType?: TypeDefinitionData;
  falseType?: TypeDefinitionData;
  trueType?: TypeDefinitionData;
  extendsType?: {
    type: string;
    declaration?: TypeDeclarationContentData;
  };
  declaration?: TypeDeclarationContentData;
  value?: string | number | boolean | null;
  operator?: string;
  package?: string;
  objectType?: {
    name: string;
    type: string;
  };
  indexType?: {
    name?: string;
    type?: string;
    value: string;
  };
  qualifiedName?: string;
  head?: string;
  tail?: (TypeDefinitionData | string)[][];
  target?: TypeDefinitionData;
};

export type MethodParamData = {
  name: string;
  type: TypeDefinitionData;
  comment?: CommentData;
  flags?: TypePropertyDataFlags;
  defaultValue?: string;
};

export type TypePropertyDataFlags = {
  isExternal?: boolean;
  isOptional?: boolean;
  isStatic?: boolean;
  isRest?: boolean;
  isReadonly?: boolean;
};

// Constants section

export type ConstantDefinitionData = {
  name: string;
  flags?: {
    isConst: boolean;
  };
  comment?: CommentData;
  kind: TypeDocKind;
  type?: TypeDefinitionData;
};

// Enums section

export type EnumDefinitionData = {
  name: string;
  children: EnumValueData[];
  comment?: CommentData;
  kind: TypeDocKind;
};

export type EnumValueData = {
  name: string;
  comment?: CommentData;
  kind: TypeDocKind;
  defaultValue?: string;
  type: TypeDefinitionData;
};

// Interfaces section

export type InterfaceDefinitionData = {
  name: string;
  children: PropData[];
  comment?: CommentData;
  kind: TypeDocKind;
  extendedTypes?: TypeDefinitionData[];
  implementedTypes?: TypeDefinitionData[];
};

// Classes section

export type ClassDefinitionData = InterfaceDefinitionData & {
  type?: TypeDefinitionData;
  isSensor: boolean;
};

// Methods section

export type MethodDefinitionData = {
  name: string;
  signatures: MethodSignatureData[];
  getSignature?: MethodSignatureData[];
  setSignatures?: MethodSignatureData[];
  kind: TypeDocKind;
};

export type AccessorDefinitionData = {
  name: string;
  getSignature?: MethodSignatureData;
  kind: TypeDocKind;
};

export type MethodSignatureData = {
  name: string;
  parameters: MethodParamData[];
  comment: CommentData;
  type: TypeDefinitionData;
  kind?: TypeDocKind;
  typeParameter?: TypeParameterData[];
};

// Properties section

export type PropsDefinitionData = {
  name: string;
  type?: TypeDefinitionData;
  kind: TypeDocKind;
  comment?: CommentData;
  children?: PropData[];
  extendedTypes?: TypeDefinitionData[];
};

export type PropData = {
  name: string;
  kind?: TypeDocKind;
  comment?: CommentData;
  type: TypeDefinitionData;
  flags?: TypePropertyDataFlags;
  defaultValue?: string;
  signatures?: MethodSignatureData[];
  getSignature?: MethodSignatureData;
  overwrites?: TypeDefinitionData;
  implementationOf?: TypeDefinitionData;
  inheritedFrom?: InheritedFromData;
};

export type DefaultPropsDefinitionData = {
  name: string;
  type: TypeDefinitionData;
  kind: TypeDocKind;
};

// Types section

export type TypeGeneralData = {
  name: string;
  comment: CommentData;
  type: TypeDefinitionData;
  typeParameter?: TypeGeneralData[];
  kind: TypeDocKind;
  variant?: string;
};

export type TypeDeclarationContentData = {
  name?: string;
  kind?: TypeDocKind;
  indexSignature?: TypeSignaturesData;
  signatures?: TypeSignaturesData[];
  parameters?: PropData[];
  children?: PropData[];
  comment?: CommentData;
};

export type TypeSignaturesData = Partial<MethodSignatureData>;

export type TypeParameterData = {
  name: string;
  kind: TypeDocKind;
  variant: string;
};

export type InheritedFromData = {
  type: 'reference';
  name: string;
};
