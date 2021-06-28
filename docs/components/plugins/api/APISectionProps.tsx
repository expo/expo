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
  TypeDefinitionData,
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
    (defaultProp: PropData) => defaultProp.name === name
  )[0]?.defaultValue;
};

const renderInheritedProp = (ip: TypeDefinitionData) => {
  return ip?.typeArguments ? (
    <LI key={`inherited-prop-${ip.name}-${ip.type}`}>
      <InlineCode>{resolveTypeName(ip)}</InlineCode>
    </LI>
  ) : null;
};

const renderInheritedProps = (data: TypeDefinitionData[] | undefined): JSX.Element | undefined => {
  const inheritedProps = data?.filter((ip: TypeDefinitionData) => ip.type === 'reference') ?? [];
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
  const propsDeclarations = type.types
    ?.filter((t: TypeDefinitionData) => t.declaration)
    .map(def => def?.declaration?.children)
    .flat()
    .filter((dec, i, arr) => arr.findIndex(t => t?.name === dec?.name) === i);

  return (
    <div key={`props-definition-${name}`}>
      <UL>
        {propsDeclarations?.map(prop =>
          prop ? renderProp(prop, extractDefaultPropValue(prop, defaultValues)) : null
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
