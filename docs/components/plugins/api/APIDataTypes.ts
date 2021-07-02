import { TypeDocKind } from '~/components/plugins/api/APISectionUtils';

// Generic data type

export type GeneratedData = EnumDefinitionData &
  MethodDefinitionData &
  PropsDefinitionData &
  DefaultPropsDefinitionData &
  TypeGeneralData &
  InterfaceDefinitionData &
  ConstantDefinitionData;

// Shared data types

export type CommentData = {
  text?: string;
  shortText?: string;
  returns?: string;
  tags?: CommentTagData[];
};

export type CommentTagData = {
  tag: string;
  text: string;
};

export type TypeDefinitionData = {
  name?: string;
  type: string;
  types?: TypeDefinitionData[];
  elements?: TypeDefinitionData[];
  elementType?: {
    name: string;
    type: string;
  };
  queryType?: {
    name: string;
    type: string;
  };
  typeArguments?: TypeDefinitionData[];
  declaration?: TypeDeclarationContentData;
  value?: string | boolean | null;
};

export type MethodParamData = {
  name: string;
  type: TypeDefinitionData;
  comment?: CommentData;
};

export type TypePropertyDataFlags = {
  isOptional: boolean;
};

// Constants section

export type ConstantDefinitionData = {
  name: string;
  flags?: {
    isConst: boolean;
  };
  comment?: CommentData;
  kind: TypeDocKind;
  type: TypeDefinitionData;
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
};

// Interfaces section

export type InterfaceDefinitionData = {
  name: string;
  children: InterfaceValueData[];
  comment?: CommentData;
  kind: TypeDocKind;
};

export type InterfaceValueData = {
  name: string;
  type: TypeDefinitionData;
  flags?: TypePropertyDataFlags;
  kind: TypeDocKind;
  comment?: CommentData;
};

// Methods section

export type MethodDefinitionData = {
  signatures: MethodSignatureData[];
  kind: TypeDocKind;
};

export type MethodSignatureData = {
  name: string;
  parameters: MethodParamData[];
  comment: CommentData;
  type: TypeDefinitionData;
};

// Props section

export type PropsDefinitionData = {
  name: string;
  type: TypeDefinitionData;
  kind: TypeDocKind;
};

export type PropData = {
  name: string;
  comment: CommentData;
  type: TypeDefinitionData;
  flags?: TypePropertyDataFlags;
  defaultValue?: string;
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
  kind: TypeDocKind;
};

export type TypeDeclarationContentData = {
  signatures: TypeSignaturesData[];
  children?: PropData[];
};

export type TypeSignaturesData = {
  parameters?: MethodParamData[];
  type: TypeDefinitionData;
};
