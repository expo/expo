import { CodeBlock } from '~/components/base/code';
import { CODE } from '~/ui/components/Text';

import { TypeDefinitionData } from '../APIDataTypes';
import { resolveTypeName } from '../APISectionUtils';
import { APITypePopover, getNodeText, isLongType } from './APITypePopover';

const typeDefinitionContainsObject = (typDef: TypeDefinitionData) =>
  typDef.type === 'reflection' && typDef.declaration;

type APIDataTypeProps = {
  typeDefinition: TypeDefinitionData;
  sdkVersion: string;
  inline?: boolean;
  collapsible?: boolean;
};

export const APIDataType = ({
  typeDefinition,
  sdkVersion,
  inline = true,
  collapsible = false,
}: APIDataTypeProps) => {
  const { type, declaration, types, elementType, typeArguments } = typeDefinition;

  const isObjectDefinition = type === 'reflection' && declaration?.children?.length;
  const isIntersectionWithObject =
    type === 'intersection' && types?.filter(typeDefinitionContainsObject).length;
  const isUnionWithObject =
    (type === 'union' || elementType?.type === 'union') &&
    (types?.filter(typeDefinitionContainsObject)?.length ?? 0) > 0;
  const isObjectWrapped =
    type === 'reference' &&
    typeArguments &&
    typeArguments?.filter(typeDefinitionContainsObject).length > 0;

  const typeName = resolveTypeName(typeDefinition, sdkVersion);
  const content =
    isObjectDefinition || isIntersectionWithObject || isUnionWithObject || isObjectWrapped ? (
      <CodeBlock inline={inline} key={typeDefinition.name}>
        {typeName}
      </CodeBlock>
    ) : (
      <CODE key={typeDefinition.name} className="[&>span]:text-inherit!">
        {typeName}
      </CODE>
    );

  const text = getNodeText(typeName);
  return collapsible && isLongType(text) ? (
    <APITypePopover text={text}>{content}</APITypePopover>
  ) : (
    content
  );
};
