import React from 'react';

import { InlineCode } from '~/components/base/code';
import { LI, UL } from '~/components/base/list';
import { P } from '~/components/base/paragraph';
import { H2, H4, H4Code } from '~/components/plugins/Headings';
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
  defaultProps?: DefaultPropsDefinitionData;
  header?: string;
};

const UNKNOWN_VALUE = '...';

const extractDefaultPropValue = (
  { comment, name }: PropData,
  defaultProps?: DefaultPropsDefinitionData
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
  return (
    <LI key={`inherited-prop-${ip.name}-${ip.type}`}>
      {ip?.typeArguments ? (
        <InlineCode>{resolveTypeName(ip)}</InlineCode>
      ) : (
        <InlineCode>{ip.name}</InlineCode>
      )}
    </LI>
  );
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
  defaultValues?: DefaultPropsDefinitionData
): JSX.Element => {
  const baseTypes = type.types
    ? type.types?.filter((t: TypeDefinitionData) => t.declaration)
    : [type];
  const propsDeclarations = baseTypes
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

const APISectionProps: React.FC<APISectionPropsProps> = ({
  data,
  defaultProps,
  header = 'Props',
}) =>
  data?.length ? (
    <>
      {header === 'Props' ? (
        <H2 key="props-header">{header}</H2>
      ) : (
        <>
          <H4Code key={`${header}-props-header`}>
            <InlineCode>{header}</InlineCode>
          </H4Code>
          <br />
        </>
      )}
      {data.map((propsDefinition: PropsDefinitionData) =>
        renderProps(propsDefinition, defaultProps)
      )}
    </>
  ) : null;

export default APISectionProps;
