import React from 'react';

import { InlineCode } from '~/components/base/code';
import { LI, UL } from '~/components/base/list';
import { P } from '~/components/base/paragraph';
import { H2, H4 } from '~/components/plugins/Headings';
import {
  CommentTagData,
  DefaultPropsDefinitionData,
  PropData,
  PropsDefinitionData,
  TypeDeclarationData,
  TypePropertyData,
} from '~/components/plugins/api/APIDataTypes';
import {
  CommentTextBlock,
  resolveTypeName,
  STYLES_SECONDARY,
} from '~/components/plugins/api/APISectionUtils';

export type APISectionPropsProps = {
  data: PropsDefinitionData[];
  defaultProps: DefaultPropsDefinitionData;
};

const UNKNOWN_VALUE = '...';

const extractDefaultPropValue = (
  { comment, name }: PropData,
  defaultProps: DefaultPropsDefinitionData
): string | undefined => {
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
  const inheritedProps = data?.filter((ip: TypeDeclarationData) => ip.type === 'reference') ?? [];
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
  const propsDeclarations = type.types?.filter((e: TypeDeclarationData) => e.declaration);
  return (
    <div key={`props-definition-${name}`}>
      <UL>
        {propsDeclarations?.map((def: TypeDeclarationData) =>
          def.declaration?.children?.map((prop: PropData) =>
            renderProp(prop, extractDefaultPropValue(prop, defaultValues))
          )
        )}
      </UL>
      {renderInheritedProps(type.types)}
    </div>
  );
};

const renderProp = ({ comment, name, type, flags }: PropData, defaultValue?: string) => (
  <LI key={`prop-entry-${name}`}>
    <H4>{name}</H4>
    <P>
      {flags?.isOptional && <span css={STYLES_SECONDARY}>Optional&emsp;&bull;&emsp;</span>}
      <span css={STYLES_SECONDARY}>Type:</span> <InlineCode>{resolveTypeName(type)}</InlineCode>
      {defaultValue && defaultValue !== UNKNOWN_VALUE ? (
        <span>
          <span css={STYLES_SECONDARY}>&emsp;&bull;&emsp;Default:</span>{' '}
          <InlineCode>{defaultValue}</InlineCode>
        </span>
      ) : null}
    </P>
    <CommentTextBlock comment={comment} />
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
