import React from 'react';
import ReactMarkdown from 'react-markdown';

import { InlineCode } from '~/components/base/code';
import { UL, LI } from '~/components/base/list';
import { B } from '~/components/base/paragraph';
import { H2, H3Code, H4 } from '~/components/plugins/Headings';
import {
  TypeDeclarationContentData,
  TypeGeneralData,
  TypePropertyData,
  TypeSignaturesData,
  TypeValueData,
} from '~/components/plugins/api/APIDataTypes';
import {
  mdInlineRenderers,
  mdRenderers,
  resolveTypeName,
  renderParam,
  CommentTextBlock,
  STYLES_OPTIONAL,
} from '~/components/plugins/api/APISectionUtils';

export type APISectionTypesProps = {
  data: TypeGeneralData[];
};

const defineLiteralType = (types: TypeValueData[]): string => {
  const uniqueTypes = Array.from(new Set(types.map((t: TypeValueData) => typeof t.value)));
  if (uniqueTypes.length === 1) {
    return '`' + uniqueTypes[0] + '` - ';
  }
  return '';
};

const decorateValue = (type: TypeValueData): string =>
  typeof type?.value === 'string'
    ? "`'" + type.value + "'`"
    : '`' + (type.value || type.name) + '`';

const renderTypeDeclarationTable = ({ children }: TypeDeclarationContentData): JSX.Element => (
  <table key={`type-declaration-table-${children.map(child => child.name).join('-')}`}>
    <thead>
      <tr>
        <th>Name</th>
        <th>Type</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>{children.map(renderTypePropertyRow)}</tbody>
  </table>
);

const renderTypePropertyRow = ({
  name,
  flags,
  type,
  comment,
  defaultValue,
}: TypePropertyData): JSX.Element => {
  const initValue = defaultValue || comment?.tags?.filter(tag => tag.tag === 'default')[0]?.text;
  return (
    <tr key={name}>
      <td>
        <B>{name}</B>
        {flags?.isOptional ? (
          <>
            <br />
            <span css={STYLES_OPTIONAL}>(optional)</span>
          </>
        ) : null}
      </td>
      <td>
        <InlineCode>{resolveTypeName(type)}</InlineCode>
      </td>
      <td>
        {comment?.shortText ? (
          <ReactMarkdown renderers={mdInlineRenderers}>{comment.shortText}</ReactMarkdown>
        ) : (
          '-'
        )}
        {initValue ? (
          <>
            <br />
            <ReactMarkdown
              renderers={mdInlineRenderers}>{`__Default:__ ${initValue}`}</ReactMarkdown>
          </>
        ) : null}
      </td>
    </tr>
  );
};

const renderType = ({ name, comment, type }: TypeGeneralData): JSX.Element | undefined => {
  if (type.declaration) {
    // Object Types
    return (
      <div key={`type-definition-${name}`}>
        <H3Code>
          <InlineCode>
            {name}
            {type.declaration.signatures ? '()' : ''}
          </InlineCode>
        </H3Code>
        <CommentTextBlock comment={comment} />
        {type.declaration.children && renderTypeDeclarationTable(type.declaration)}
        {type.declaration.signatures
          ? type.declaration.signatures.map(({ parameters }: TypeSignaturesData) => (
              <div key={`type-definition-signature-${name}`}>
                {parameters ? <H4>Arguments</H4> : null}
                {parameters ? <UL>{parameters?.map(renderParam)}</UL> : null}
              </div>
            ))
          : null}
      </div>
    );
  } else if (type.types && type.type === 'union') {
    const literalTypes = type.types.filter(
      (t: TypeValueData) => t.type === 'literal' || t.type === 'intrinsic'
    );
    const propTypes = type.types.filter((t: TypeValueData) => t.type === 'reflection');
    if (literalTypes.length) {
      return (
        <div key={`type-definition-${name}`}>
          <H3Code>
            <InlineCode>{name}</InlineCode>
          </H3Code>
          <ReactMarkdown renderers={mdRenderers}>
            {defineLiteralType(literalTypes) +
              `Acceptable values are: ${literalTypes.map(decorateValue).join(', ')}.`}
          </ReactMarkdown>
        </div>
      );
    } else if (propTypes.length) {
      return (
        <div key={`prop-type-definition-${name}`}>
          <H3Code>
            <InlineCode>{name}</InlineCode>
          </H3Code>
          <CommentTextBlock comment={comment} />
          {propTypes.map(
            propType =>
              propType?.declaration?.children && renderTypeDeclarationTable(propType.declaration)
          )}
        </div>
      );
    }
  } else if (type.name === 'Record' && type.typeArguments) {
    return (
      <div key={`record-definition-${name}`}>
        <H3Code>
          <InlineCode>{name}</InlineCode>
        </H3Code>
        <UL>
          <LI>
            <InlineCode>
              Record&lt;{type.typeArguments[0].name}, {resolveTypeName(type.typeArguments[1])}&gt;
            </InlineCode>
          </LI>
        </UL>
        <CommentTextBlock comment={comment} />
      </div>
    );
  }
  return undefined;
};

const APISectionTypes: React.FC<APISectionTypesProps> = ({ data }) =>
  data?.length ? (
    <>
      <H2 key="types-header">Types</H2>
      {data.map(renderType)}
    </>
  ) : null;

export default APISectionTypes;
