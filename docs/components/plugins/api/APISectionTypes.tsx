import { css } from '@emotion/core';
import { theme } from '@expo/styleguide';
import React from 'react';
import ReactMarkdown from 'react-markdown';

import { InlineCode } from '~/components/base/code';
import { B } from '~/components/base/paragraph';
import { H2, H3Code } from '~/components/plugins/Headings';
import {
  APISubSectionProps,
  inlineRenderers,
  renderers,
  resolveTypeName,
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

const renderType = ({ name, comment, type }: any): JSX.Element | undefined => {
  if (type.declaration) {
    return (
      <div key={`type-definition-${name}`}>
        <H3Code>
          <InlineCode>{name}</InlineCode>
        </H3Code>
        {comment ? <ReactMarkdown renderers={renderers}>{comment.shortText}</ReactMarkdown> : null}
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {type.declaration.children.map((typeProperty: any) => (
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
                    <ReactMarkdown renderers={inlineRenderers}>
                      {typeProperty.comment.shortText}
                    </ReactMarkdown>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
