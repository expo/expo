import React from 'react';

import { InlineCode } from '~/components/base/code';
import { LI, UL } from '~/components/base/list';
import { B } from '~/components/base/paragraph';
import { H2, H4 } from '~/components/plugins/Headings';
import { TypeDeclarationData, TypePropertyData } from '~/components/plugins/api/APISectionTypes';
import {
  CommentData,
  CommentTagData,
  CommentTextBlock,
  inlineRenderers,
  resolveTypeName,
  TypeDefinitionData,
  TypeDocKind,
} from '~/components/plugins/api/APISectionUtils';

export type APISectionPropsProps = {
  data: PropsDefinitionData[];
  defaultProps: DefaultPropsDefinitionData;
};

export type PropsDefinitionData = {
  name: string;
  type: {
    types: TypeDeclarationData[];
  };
  kind: TypeDocKind;
};

type PropData = {
  name: string;
  comment: CommentData;
  type: TypeDefinitionData;
};

export type DefaultPropsDefinitionData = {
  name: string;
  type: TypeDeclarationData;
  kind: TypeDocKind;
};

const UNKNOWN_VALUE = '...';

const extractDefaultPropValue = (
  { comment, name }: PropData,
  defaultProps: DefaultPropsDefinitionData
): string => {
  const annotationDefault = comment?.tags?.filter((tag: CommentTagData) => tag.tag === 'default');
  if (annotationDefault?.length) {
    return annotationDefault[0].text;
  }
  return defaultProps?.type?.declaration?.children?.filter(
    (defaultProp: TypePropertyData) => defaultProp.name === name
  )[0]?.defaultValue;
};

const renderInheritedProp = (ip: TypeDeclarationData) => {
  const component = ip?.typeArguments ? ip.typeArguments[0]?.queryType?.name : null;
  return component ? (
    <LI key={`inherited-prop-${component}`}>
      <InlineCode>{component}</InlineCode>
    </LI>
  ) : null;
};

const renderInheritedProps = (data: TypeDeclarationData[]): JSX.Element | undefined => {
  const inheritedProps = data.filter((ip: TypeDeclarationData) => ip.type === 'reference');
  if (inheritedProps.length) {
    return (
      <div>
        <H4>Inherited Props</H4>
        <UL>{inheritedProps.map(renderInheritedProp)}</UL>
      </div>
    );
  }
  return undefined;
};

const renderProps = (
  { name, type }: PropsDefinitionData,
  defaultValues: DefaultPropsDefinitionData
): JSX.Element => {
  const props = type.types.filter((e: TypeDeclarationData) => e.declaration);
  return (
    <div key={`props-definition-${name}`}>
      <UL>
        {props?.map((def: TypeDeclarationData) =>
          def.declaration?.children.map((prop: PropData) =>
            renderProp(prop, extractDefaultPropValue(prop, defaultValues))
          )
        )}
      </UL>
      {renderInheritedProps(type.types)}
    </div>
  );
};

const renderProp = ({ comment, name, type }: PropData, defaultValue: string) => (
  <LI key={`prop-entry-${name}`}>
    <B>
      {name} (<InlineCode>{resolveTypeName(type)}</InlineCode>)
    </B>
    <CommentTextBlock comment={comment} renderers={inlineRenderers} withDash />
    {defaultValue && defaultValue !== UNKNOWN_VALUE ? (
      <span>
        {' Default: '}
        <InlineCode>{defaultValue}</InlineCode>
      </span>
    ) : null}
  </LI>
);

const APISectionProps: React.FC<APISectionPropsProps> = ({ data, defaultProps }) =>
  data?.length ? (
    <>
      <H2 key="props-header">Props</H2>
      {data.map((propsDefinition: PropsDefinitionData) =>
        renderProps(propsDefinition, defaultProps)
      )}
    </>
  ) : null;

export default APISectionProps;
