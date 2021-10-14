import { css } from '@emotion/react';
import React from 'react';

import { InlineCode } from '~/components/base/code';
import { H4 } from '~/components/base/headings';
import { LI, UL } from '~/components/base/list';
import { P } from '~/components/base/paragraph';
import { H2, H3, H3Code } from '~/components/plugins/Headings';
import {
  DefaultPropsDefinitionData,
  PropData,
  PropsDefinitionData,
  TypeDefinitionData,
} from '~/components/plugins/api/APIDataTypes';
import {
  CommentTextBlock,
  getCommentOrSignatureComment,
  getTagData,
  renderTypeOrSignatureType,
  resolveTypeName,
  STYLES_SECONDARY,
} from '~/components/plugins/api/APISectionUtils';

export type APISectionPropsProps = {
  data: PropsDefinitionData[];
  defaultProps?: DefaultPropsDefinitionData;
  header?: string;
};

const UNKNOWN_VALUE = '...';

const PROP_LIST_ELEMENT_STYLE = css`
  padding: 0;
`;

const extractDefaultPropValue = (
  { comment, name }: PropData,
  defaultProps?: DefaultPropsDefinitionData
): string | undefined => {
  const annotationDefault = getTagData('default', comment);
  if (annotationDefault) {
    return annotationDefault.text;
  }
  return defaultProps?.type?.declaration?.children?.filter(
    (defaultProp: PropData) => defaultProp.name === name
  )[0]?.defaultValue;
};

const renderInheritedProp = (ip: TypeDefinitionData) => {
  return (
    <LI key={`inherited-prop-${ip.name}-${ip.type}`}>
      <InlineCode>{resolveTypeName(ip)}</InlineCode>
    </LI>
  );
};

const renderInheritedProps = (
  data: TypeDefinitionData[] | undefined,
  exposeInSidebar?: boolean
): JSX.Element | undefined => {
  const inheritedProps = data?.filter((ip: TypeDefinitionData) => ip.type === 'reference') ?? [];
  if (inheritedProps.length) {
    return (
      <>
        {exposeInSidebar ? <H3>Inherited Props</H3> : <H4>Inherited Props</H4>}
        <UL>{inheritedProps.map(renderInheritedProp)}</UL>
      </>
    );
  }
  return undefined;
};

const renderProps = (
  { name, type }: PropsDefinitionData,
  defaultValues?: DefaultPropsDefinitionData,
  exposeInSidebar?: boolean
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
          prop
            ? renderProp(prop, extractDefaultPropValue(prop, defaultValues), exposeInSidebar)
            : null
        )}
      </UL>
      {renderInheritedProps(type.types, exposeInSidebar)}
    </div>
  );
};

export const renderProp = (
  { comment, name, type, flags, signatures }: PropData,
  defaultValue?: string,
  exposeInSidebar?: boolean
) => (
  <LI key={`prop-entry-${name}`} customCss={exposeInSidebar ? PROP_LIST_ELEMENT_STYLE : undefined}>
    {exposeInSidebar ? (
      <H3Code>
        <InlineCode>{name}</InlineCode>
      </H3Code>
    ) : (
      <H4>{name}</H4>
    )}
    <P>
      {flags?.isOptional && <span css={STYLES_SECONDARY}>Optional&emsp;&bull;&emsp;</span>}
      <span css={STYLES_SECONDARY}>Type:</span> {renderTypeOrSignatureType(type, signatures, true)}
      {defaultValue && defaultValue !== UNKNOWN_VALUE ? (
        <span>
          <span css={STYLES_SECONDARY}>&emsp;&bull;&emsp;Default:</span>{' '}
          <InlineCode>{defaultValue}</InlineCode>
        </span>
      ) : null}
    </P>
    <CommentTextBlock comment={getCommentOrSignatureComment(comment, signatures)} />
  </LI>
);

const APISectionProps = ({ data, defaultProps, header = 'Props' }: APISectionPropsProps) =>
  data?.length ? (
    <>
      {header === 'Props' ? (
        <H2 key="props-header">{header}</H2>
      ) : (
        <>
          <H3Code key={`${header}-props-header`}>
            <InlineCode>{header}</InlineCode>
          </H3Code>
          <br />
        </>
      )}
      {data.map((propsDefinition: PropsDefinitionData) =>
        renderProps(propsDefinition, defaultProps, header === 'Props')
      )}
    </>
  ) : null;

export default APISectionProps;
