import React from 'react';
import ReactMarkdown from 'react-markdown';

import { InlineCode } from '~/components/base/code';
import { UL, LI } from '~/components/base/list';
import { B, P } from '~/components/base/paragraph';
import { H2, H3Code, H4 } from '~/components/plugins/Headings';
import {
  PropData,
  TypeDeclarationContentData,
  TypeDefinitionData,
  TypeGeneralData,
  TypeSignaturesData,
} from '~/components/plugins/api/APIDataTypes';
import {
  mdInlineComponents,
  mdComponents,
  resolveTypeName,
  renderFlags,
  renderParam,
  CommentTextBlock,
  parseCommentContent,
  renderTypeOrSignatureType,
  getCommentOrSignatureComment,
  getTagData,
} from '~/components/plugins/api/APISectionUtils';

export type APISectionTypesProps = {
  data: TypeGeneralData[];
};

const defineLiteralType = (types: TypeDefinitionData[]): JSX.Element | null => {
  const uniqueTypes = Array.from(
    new Set(types.map((t: TypeDefinitionData) => t.value && typeof t.value))
  );
  if (uniqueTypes.length === 1 && uniqueTypes.filter(Boolean).length === 1) {
    return (
      <>
        <InlineCode>{uniqueTypes[0]}</InlineCode>
        {' - '}
      </>
    );
  }
  return null;
};

const renderTypeDeclarationTable = ({ children }: TypeDeclarationContentData): JSX.Element => (
  <table key={`type-declaration-table-${children?.map(child => child.name).join('-')}`}>
    <thead>
      <tr>
        <th>Name</th>
        <th>Type</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>{children?.map(renderTypePropertyRow)}</tbody>
  </table>
);

const renderTypePropertyRow = ({
  name,
  flags,
  type,
  comment,
  defaultValue,
  signatures,
}: PropData): JSX.Element => {
  const initValue = parseCommentContent(defaultValue || getTagData('default', comment)?.text);
  const commentData = getCommentOrSignatureComment(comment, signatures);
  return (
    <tr key={name}>
      <td>
        <B>{name}</B>
        {renderFlags(flags)}
      </td>
      <td>{renderTypeOrSignatureType(type, signatures)}</td>
      <td>
        {commentData ? (
          <CommentTextBlock comment={commentData} components={mdInlineComponents} />
        ) : (
          '-'
        )}
        {initValue ? (
          <>
            <br />
            <br />
            <ReactMarkdown
              components={mdInlineComponents}>{`__Default:__ ${initValue}`}</ReactMarkdown>
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
  } else if (type.types && ['union', 'intersection'].includes(type.type)) {
    const literalTypes = type.types.filter((t: TypeDefinitionData) =>
      ['literal', 'intrinsic', 'reference', 'tuple'].includes(t.type)
    );
    const propTypes = type.types.filter((t: TypeDefinitionData) => t.type === 'reflection');
    if (propTypes.length) {
      return (
        <div key={`prop-type-definition-${name}`}>
          <H3Code>
            <InlineCode>{name}</InlineCode>
          </H3Code>
          {type.type === 'intersection' ? (
            <P>
              <InlineCode>
                {type.types.filter(type => type.type === 'reference').map(resolveTypeName)}
              </InlineCode>{' '}
              extended by:
            </P>
          ) : null}
          <CommentTextBlock comment={comment} />
          {propTypes.map(
            propType =>
              propType?.declaration?.children && renderTypeDeclarationTable(propType.declaration)
          )}
        </div>
      );
    } else if (literalTypes.length) {
      return (
        <div key={`type-definition-${name}`}>
          <H3Code>
            <InlineCode>{name}</InlineCode>
          </H3Code>
          <CommentTextBlock comment={comment} />
          <P>
            {defineLiteralType(literalTypes)}
            Acceptable values are:{' '}
            {literalTypes.map((lt, index) => (
              <span key={`${name}-literal-type-${index}`}>
                <InlineCode>{resolveTypeName(lt)}</InlineCode>
                {index + 1 !== literalTypes.length ? ', ' : '.'}
              </span>
            ))}
          </P>
        </div>
      );
    }
  } else if ((type.name === 'Record' && type.typeArguments) || type.type === 'reference') {
    return (
      <div key={`record-definition-${name}`}>
        <H3Code>
          <InlineCode>{name}</InlineCode>
        </H3Code>
        <UL>
          <LI>
            <InlineCode>{resolveTypeName(type)}</InlineCode>
          </LI>
        </UL>
        <CommentTextBlock comment={comment} />
      </div>
    );
  } else if (type.type === 'intrinsic') {
    return (
      <div key={`generic-type-definition-${name}`}>
        <H3Code>
          <InlineCode>{name}</InlineCode>
        </H3Code>
        <CommentTextBlock comment={comment} />
        <ReactMarkdown components={mdComponents}>{'__Type:__ `' + type.name + '`'}</ReactMarkdown>
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
