import React from 'react';

import { InlineCode } from '~/components/base/code';
import { UL, LI } from '~/components/base/list';
import { B, P } from '~/components/base/paragraph';
import { H2, H3Code } from '~/components/plugins/Headings';
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
  CommentTextBlock,
  parseCommentContent,
  renderTypeOrSignatureType,
  getCommentOrSignatureComment,
  getTagData,
  renderParams,
  renderTableHeadRow,
  renderDefaultValue,
  STYLES_APIBOX,
} from '~/components/plugins/api/APISectionUtils';
import { Cell, Row, Table } from '~/ui/components/Table';

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
  <Table key={`type-declaration-table-${children?.map(child => child.name).join('-')}`}>
    {renderTableHeadRow()}
    <tbody>{children?.map(renderTypePropertyRow)}</tbody>
  </Table>
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
    <Row key={name}>
      <Cell fitContent>
        <B>{name}</B>
        {renderFlags(flags)}
      </Cell>
      <Cell fitContent>{renderTypeOrSignatureType(type, signatures)}</Cell>
      <Cell fitContent>
        <CommentTextBlock
          comment={commentData}
          components={mdInlineComponents}
          afterContent={renderDefaultValue(initValue)}
          emptyCommentFallback="-"
        />
      </Cell>
    </Row>
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
      <div key={`type-definition-${name}`} css={STYLES_APIBOX}>
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
                {parameters && renderParams(parameters)}
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
        <div key={`prop-type-definition-${name}`} css={STYLES_APIBOX}>
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
        <div key={`type-definition-${name}`} css={STYLES_APIBOX}>
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
      <div key={`record-definition-${name}`} css={STYLES_APIBOX}>
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
      <div key={`generic-type-definition-${name}`} css={STYLES_APIBOX}>
        <H3Code>
          <InlineCode>{name}</InlineCode>
        </H3Code>
        <CommentTextBlock comment={comment} />
        <P>
          <B>Type: </B>
          <InlineCode>{type.name}</InlineCode>
        </P>
      </div>
    );
  } else if (type.type === 'conditional' && type.checkType) {
    return (
      <div key={`conditional-type-definition-${name}`} css={STYLES_APIBOX}>
        <H3Code>
          <InlineCode>
            {name}&lt;{type.checkType.name}&gt;
          </InlineCode>
        </H3Code>
        <CommentTextBlock comment={comment} />
        <P>
          <B>Generic: </B>
          <InlineCode>
            {type.checkType.name}
            {typeParameter && <> extends {resolveTypeName(typeParameter[0].type)}</>}
          </InlineCode>
        </P>
        <P>
          <B>Type: </B>
          <InlineCode>
            {type.checkType.name}
            {typeParameter && <> extends {type.extendsType && resolveTypeName(type.extendsType)}</>}
            {' ? '}
            {type.trueType && resolveTypeName(type.trueType)}
            {' : '}
            {type.falseType && resolveTypeName(type.falseType)}
          </InlineCode>
        </P>
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
