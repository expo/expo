import { Fragment } from 'react';

import { H2, H3Code } from '~/components/plugins/Headings';
import {
  PropData,
  TypeDeclarationContentData,
  TypeDefinitionData,
  TypeGeneralData,
  TypeSignaturesData,
} from '~/components/plugins/api/APIDataTypes';
import { APISectionDeprecationNote } from '~/components/plugins/api/APISectionDeprecationNote';
import {
  mdComponents,
  resolveTypeName,
  renderFlags,
  CommentTextBlock,
  parseCommentContent,
  renderTypeOrSignatureType,
  getCommentOrSignatureComment,
  getTagData,
  renderParams,
  ParamsTableHeadRow,
  renderDefaultValue,
  renderIndexSignature,
  STYLES_APIBOX,
  getTagNamesList,
} from '~/components/plugins/api/APISectionUtils';
import { Cell, Row, Table } from '~/ui/components/Table';
import { UL, LI, BOLD, P, CODE } from '~/ui/components/Text';

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
        <CODE>{uniqueTypes[0]}</CODE>
        {' - '}
      </>
    );
  }
  return null;
};

const renderTypeDeclarationTable = (
  { children, indexSignature, comment }: TypeDeclarationContentData,
  index?: number
): JSX.Element => (
  <Fragment key={`type-declaration-table-${children?.map(child => child.name).join('-')}`}>
    {index && index > 0 ? <br /> : undefined}
    <CommentTextBlock comment={comment} />
    <Table>
      <ParamsTableHeadRow />
      <tbody>
        {children?.map(renderTypePropertyRow)}
        {indexSignature?.parameters && indexSignature.parameters.map(renderTypePropertyRow)}
      </tbody>
    </Table>
  </Fragment>
);

const renderTypePropertyRow = ({
  name,
  flags,
  type,
  comment,
  defaultValue,
  signatures,
  kind,
}: PropData): JSX.Element => {
  const initValue = parseCommentContent(defaultValue || getTagData('default', comment)?.text);
  const commentData = getCommentOrSignatureComment(comment, signatures);
  const hasDeprecationNote = Boolean(getTagData('deprecated', comment));
  return (
    <Row key={name}>
      <Cell fitContent>
        <BOLD>{name}</BOLD>
        {renderFlags(flags, initValue)}
        {kind && renderIndexSignature(kind)}
      </Cell>
      <Cell fitContent>{renderTypeOrSignatureType(type, signatures, true)}</Cell>
      <Cell fitContent>
        <APISectionDeprecationNote comment={comment} />
        <CommentTextBlock
          comment={commentData}
          components={mdComponents}
          afterContent={renderDefaultValue(initValue)}
          emptyCommentFallback={hasDeprecationNote ? undefined : '-'}
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
        <APISectionDeprecationNote comment={comment} />
        <H3Code tags={getTagNamesList(comment)}>
          <CODE>
            {name}
            {type.declaration.signatures ? '()' : ''}
          </CODE>
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
          <APISectionDeprecationNote comment={comment} />
          <H3Code tags={getTagNamesList(comment)}>
            <CODE>{name}</CODE>
          </H3Code>
          <CommentTextBlock comment={comment} />
          {type.type === 'intersection' ? (
            <>
              <P>
                {type.types
                  .filter(type => ['reference', 'union', 'intersection'].includes(type.type))
                  .map(validType => (
                    <Fragment key={`nested-reference-type-${validType.name}`}>
                      <CODE>{resolveTypeName(validType)}</CODE>{' '}
                    </Fragment>
                  ))}
                extended by:
              </P>
              <br />
            </>
          ) : null}
          {propTypes.map(
            (propType, index) =>
              propType.declaration && renderTypeDeclarationTable(propType.declaration, index)
          )}
        </div>
      );
    } else if (literalTypes.length) {
      return (
        <div key={`type-definition-${name}`} css={STYLES_APIBOX}>
          <APISectionDeprecationNote comment={comment} />
          <H3Code tags={getTagNamesList(comment)}>
            <CODE>{name}</CODE>
          </H3Code>
          <CommentTextBlock comment={comment} />
          <P>
            {defineLiteralType(literalTypes)}
            Acceptable values are:{' '}
            {literalTypes.map((lt, index) => (
              <span key={`${name}-literal-type-${index}`}>
                <CODE>{resolveTypeName(lt)}</CODE>
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
        <APISectionDeprecationNote comment={comment} />
        <H3Code tags={getTagNamesList(comment)}>
          <CODE>{name}</CODE>
        </H3Code>
        <UL>
          <LI>
            <CODE>{resolveTypeName(type)}</CODE>
          </LI>
        </UL>
        <CommentTextBlock comment={comment} />
      </div>
    );
  } else if (type.type === 'intrinsic') {
    return (
      <div key={`generic-type-definition-${name}`} css={STYLES_APIBOX}>
        <APISectionDeprecationNote comment={comment} />
        <H3Code tags={getTagNamesList(comment)}>
          <CODE>{name}</CODE>
        </H3Code>
        <CommentTextBlock comment={comment} />
        <P>
          <BOLD>Type: </BOLD>
          <CODE>{type.name}</CODE>
        </P>
      </div>
    );
  } else if (type.type === 'conditional' && type.checkType) {
    return (
      <div key={`conditional-type-definition-${name}`} css={STYLES_APIBOX}>
        <APISectionDeprecationNote comment={comment} />
        <H3Code tags={getTagNamesList(comment)}>
          <CODE>
            {name}&lt;{type.checkType.name}&gt;
          </CODE>
        </H3Code>
        <CommentTextBlock comment={comment} />
        <P>
          <BOLD>Generic: </BOLD>
          <CODE>
            {type.checkType.name}
            {typeParameter && <> extends {resolveTypeName(typeParameter[0].type)}</>}
          </CODE>
        </P>
        <P>
          <BOLD>Type: </BOLD>
          <CODE>
            {type.checkType.name}
            {typeParameter && <> extends {type.extendsType && resolveTypeName(type.extendsType)}</>}
            {' ? '}
            {type.trueType && resolveTypeName(type.trueType)}
            {' : '}
            {type.falseType && resolveTypeName(type.falseType)}
          </CODE>
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
