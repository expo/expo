import { css } from '@emotion/core';
import { theme } from '@expo/styleguide';
import React from 'react';
import ReactMarkdown from 'react-markdown';

import { InlineCode } from '~/components/base/code';
import { UL } from '~/components/base/list';
import { B } from '~/components/base/paragraph';
import { H2, H3Code, H4 } from '~/components/plugins/Headings';
import {
  APISubSectionProps,
  inlineRenderers,
  renderers,
  resolveTypeName,
  renderParam,
} from '~/components/plugins/api/APISectionUtils';

const STYLES_OPTIONAL = css`
  color: ${theme.text.secondary};
  font-size: 90%;
  padding-top: 22px;
`;

const defineLiteralType = (types: any[]) => {
  const uniqueTypes = Array.from(new Set(types.map((t: any) => typeof t.value)));
  if (uniqueTypes.length === 1) {
    return '`' + uniqueTypes[0] + '` - ';
  }
  return undefined;
};

const decorateValue = (type: any) =>
  typeof type.value === 'string' ? "`'" + type.value + "'`" : `'` + type.value + '`';

const renderTypePropertyRow = (typeProperty: any): JSX.Element => (
  <tr key={typeProperty.name}>
    <td>
      <B>{typeProperty.name}</B>
      {typeProperty.flags?.isOptional ? (
        <>
          <br />
          <span css={STYLES_OPTIONAL}>(optional)</span>
        </>
      ) : null}
    </td>
    <td>
      <InlineCode>{resolveTypeName(typeProperty.type)}</InlineCode>
    </td>
    <td>
      {typeProperty.comment ? (
        <ReactMarkdown renderers={inlineRenderers}>{typeProperty.comment.shortText}</ReactMarkdown>
      ) : (
        '-'
      )}
    </td>
  </tr>
);

const renderType = ({ name, comment, type }: any): JSX.Element | undefined => {
  if (type.declaration) {
    return (
      <div key={`type-definition-${name}`}>
        <H3Code>
          <InlineCode>
            {name}
            {type.declaration.signatures ? '()' : ''}
          </InlineCode>
        </H3Code>
        {comment ? <ReactMarkdown renderers={renderers}>{comment.shortText}</ReactMarkdown> : null}
        {type.declaration.children ? (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>{type.declaration.children.map(renderTypePropertyRow)}</tbody>
          </table>
        ) : null}
        {type.declaration.signatures
          ? type.declaration.signatures.map(({ parameters }: any) => (
              <div>
                {parameters ? <H4>Arguments</H4> : null}
                {parameters ? <UL>{parameters?.map(renderParam)}</UL> : null}
              </div>
            ))
          : null}
      </div>
    );
  } else if (type.types && type.type === 'union') {
    // Literal Types
    const validTypes = type.types.filter((t: any) => t.type === 'literal');
    if (validTypes.length) {
      return (
        <div key={`type-definition-${name}`}>
          <H3Code>
            <InlineCode>{name}</InlineCode>
          </H3Code>
          <ReactMarkdown renderers={renderers}>
            {defineLiteralType(validTypes) +
              `Acceptable values are: ${validTypes.map(decorateValue).join(', ')}.`}
          </ReactMarkdown>
        </div>
      );
    }
  }
  return undefined;
};

const APISectionTypes: React.FC<APISubSectionProps> = ({ data }) =>
  data && data.length ? (
    <>
      <H2 key="types-header">Types</H2>
      {data.map(renderType)}
    </>
  ) : null;

export default APISectionTypes;
