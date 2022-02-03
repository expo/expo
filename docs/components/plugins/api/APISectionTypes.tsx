import React from 'react';

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
            <B>Default: </B>
            <InlineCode>{initValue}</InlineCode>
          </>
        ) : null}
      </td>
    </tr>
  );
};

const renderType = ({
  name,
  comment,
  type,
  typeParameter,
}: TypeGeneralData): JSX.Element | undefined => {
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
          ? type.declaration.signatures.map(({ parameters, comment }: TypeSignaturesData) => (
              <div key={`type-definition-signature-${name}`}>
                <CommentTextBlock comment={comment} />
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
          <CommentTextBlock comment={comment} />
          {type.type === 'intersection' ? (
            <P>
              <InlineCode>
                {type.types.filter(type => type.type === 'reference').map(resolveTypeName)}
              </InlineCode>{' '}
              extended by:
            </P>
          ) : null}
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
        <B>Type: </B>
        <InlineCode>{type.name}</InlineCode>
      </div>
    );
  } else if (type.type === 'conditional' && type.checkType) {
    return (
      <div key={`conditional-type-definition-${name}`}>
        <H3Code>
          <InlineCode>
            {name}&lt;{type.checkType.name}&gt;
          </InlineCode>
        </H3Code>
        <CommentTextBlock comment={comment} />
        <B>Generic: </B>
        <InlineCode>
          {type.checkType.name}
          {typeParameter && <> extends {resolveTypeName(typeParameter[0].type)}</>}
        </InlineCode>
        <br />
        <B>Type: </B>
        <InlineCode>
          {type.checkType.name}
          {typeParameter && <> extends {type.extendsType && resolveTypeName(type.extendsType)}</>}
          {' ? '}
          {type.trueType && resolveTypeName(type.trueType)}
          {' : '}
          {type.falseType && resolveTypeName(type.falseType)}
        </InlineCode>
      </div>
    );
  }
  return undefined;
};

const APISectionTypes = ({ data }: APISectionTypesProps) =>
  data?.length ? (
    <>
      <H2 key="types-header">Types</H2>
      {data.map(renderType)}
    </>
  ) : null;

export default APISectionTypes;
