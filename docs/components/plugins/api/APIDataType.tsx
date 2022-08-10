import React from 'react';

import { CodeBlock, InlineCode } from '~/components/base/code';
import { TypeDefinitionData } from '~/components/plugins/api/APIDataTypes';
import { resolveTypeName } from '~/components/plugins/api/APISectionUtils';

const typeDefinitionContainsObject = (typDef: TypeDefinitionData) =>
  typDef.type === 'reflection' && typDef.declaration?.children;

type APIDataTypeProps = { typeDefinition: TypeDefinitionData; inline?: boolean };

export const APIDataType = ({ typeDefinition, inline = true }: APIDataTypeProps) => {
  const { type, declaration, types, elementType, typeArguments } = typeDefinition;

  const isObjectDefinition = type === 'reflection' && declaration?.children?.length;
  const isIntersectionWithObject =
    type === 'intersection' && types?.filter(typeDefinitionContainsObject).length;
  const isUnionWithObject =
    elementType &&
    elementType.type === 'union' &&
    types?.filter(typeDefinitionContainsObject).length;
  const isObjectWrapped =
    type === 'reference' &&
    typeArguments &&
    typeArguments?.filter(typeDefinitionContainsObject).length;

  return isObjectDefinition || isIntersectionWithObject || isUnionWithObject || isObjectWrapped ? (
    <CodeBlock inline={inline} key={typeDefinition.name}>
      {resolveTypeName(typeDefinition)}
    </CodeBlock>
  ) : (
    <InlineCode key={typeDefinition.name}>{resolveTypeName(typeDefinition)}</InlineCode>
  );
};
