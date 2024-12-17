import { mergeClasses } from '@expo/styleguide';
import { CornerDownRightIcon } from '@expo/styleguide-icons/outline/CornerDownRightIcon';
import { Fragment, ReactNode } from 'react';

import { APIBox } from '~/components/plugins/APIBox';
import { APIBoxHeader } from '~/components/plugins/api/components/APIBoxHeader';
import { Cell, Row, Table } from '~/ui/components/Table';
import { H2, CODE, MONOSPACE, CALLOUT, RawH4, DEMI } from '~/ui/components/Text';

import {
  PropData,
  TypeDeclarationContentData,
  TypeDefinitionData,
  TypeGeneralData,
} from './APIDataTypes';
import { APISectionDeprecationNote } from './APISectionDeprecationNote';
import {
  resolveTypeName,
  renderFlags,
  parseCommentContent,
  getCommentOrSignatureComment,
  getTagData,
  renderParams,
  renderDefaultValue,
  renderIndexSignature,
  getCommentContent,
  listParams,
} from './APISectionUtils';
import { APICommentTextBlock } from './components/APICommentTextBlock';
import { APIDataType } from './components/APIDataType';
import { APIParamsTableHeadRow } from './components/APIParamsTableHeadRow';
import { APITypeOrSignatureType } from './components/APITypeOrSignatureType';
import { ELEMENT_SPACING, STYLES_APIBOX, STYLES_SECONDARY, VERTICAL_SPACING } from './styles';

export type APISectionTypesProps = {
  data: TypeGeneralData[];
  sdkVersion: string;
};

const defineLiteralType = (types: TypeDefinitionData[]): JSX.Element | null => {
  const uniqueTypes = Array.from(
    new Set(
      types.map((t: TypeDefinitionData) => {
        if ('head' in t) {
          return t.head;
        } else if ('value' in t) {
          return t.value && typeof t.value;
        }
      })
    )
  );
  if (uniqueTypes.length === 1 && uniqueTypes.filter(Boolean).length === 1) {
    return <CODE>{uniqueTypes[0]}</CODE>;
  }
  return null;
};

const renderTypeDeclarationTable = (
  { children, indexSignature, comment }: TypeDeclarationContentData,
  sdkVersion: string,
  index?: number
): ReactNode => (
  <Fragment key={`type-declaration-table-${children?.map(child => child.name).join('-')}`}>
    {index && index > 0 ? (
      <CALLOUT
        className={mergeClasses(STYLES_SECONDARY, 'border-t border-palette-gray4 px-4 py-3')}>
        Or object shaped as below:
      </CALLOUT>
    ) : undefined}
    <APICommentTextBlock comment={comment} />
    <Table
      containerClassName={mergeClasses(
        'mt-0.5 rounded-none border-0 border-t border-palette-gray4',
        '[&_thead]:border-palette-gray4'
      )}>
      <APIParamsTableHeadRow mainCellLabel="Property" />
      <tbody>
        {children?.map(prop => renderTypePropertyRow(prop, sdkVersion))}
        {indexSignature?.parameters?.map(param => renderTypePropertyRow(param, sdkVersion))}
      </tbody>
    </Table>
  </Fragment>
);

const renderTypeMethodEntry = (
  { children, signatures, comment }: TypeDeclarationContentData,
  sdkVersion: string
): ReactNode => {
  const baseSignature = signatures?.[0];

  if (baseSignature?.type) {
    return (
      <APIBox
        key={`type-declaration-table-${children?.map(child => child.name).join('-')}`}
        className="!mb-0">
        <RawH4 className="!mb-3">
          <MONOSPACE>
            {`(${baseSignature.parameters ? listParams(baseSignature?.parameters) : ''})`}
            {` => `}
            <APITypeOrSignatureType type={baseSignature.type} sdkVersion={sdkVersion} />
          </MONOSPACE>
        </RawH4>
        <APICommentTextBlock comment={comment} />
        <Table>
          <APIParamsTableHeadRow mainCellLabel="Parameter" />
          <tbody>
            {baseSignature.parameters?.map(param => renderTypePropertyRow(param, sdkVersion))}
          </tbody>
        </Table>
      </APIBox>
    );
  }
  return null;
};

const renderTypePropertyRow = (
  { name, flags, type, comment, defaultValue, signatures, kind }: PropData,
  sdkVersion: string
): JSX.Element => {
  const defaultTag = getTagData('default', comment);
  const initValue = parseCommentContent(
    defaultValue ?? (defaultTag ? getCommentContent(defaultTag.content) : undefined)
  );
  const commentData = getCommentOrSignatureComment(comment, signatures);
  const hasDeprecationNote = Boolean(getTagData('deprecated', comment));
  return (
    <Row key={name}>
      <Cell>
        <DEMI>{name}</DEMI>
        {renderFlags(flags, initValue)}
        {kind && renderIndexSignature(kind)}
      </Cell>
      <Cell>
        <APITypeOrSignatureType
          allowBlock
          type={type}
          signatures={signatures}
          sdkVersion={sdkVersion}
        />
      </Cell>
      <Cell>
        <APISectionDeprecationNote comment={comment} />
        <APICommentTextBlock
          inlineHeaders
          comment={commentData}
          afterContent={renderDefaultValue(initValue)}
          emptyCommentFallback={hasDeprecationNote ? undefined : '-'}
        />
      </Cell>
    </Row>
  );
};

const renderType = (
  { name, comment, type, typeParameter }: TypeGeneralData,
  sdkVersion: string
): ReactNode => {
  if (type.declaration) {
    // Object Types
    const signature = type?.declaration?.signatures?.[0];
    return (
      <div key={`type-definition-${name}`} className={STYLES_APIBOX}>
        <APISectionDeprecationNote comment={comment} sticky />
        <APIBoxHeader
          name={`${name}${signature ? `(${signature.parameters ? listParams(signature.parameters) : ''})` : ''}`}
          comment={comment}
        />
        <APICommentTextBlock comment={comment} includePlatforms={false} />
        {type.declaration.children && renderTypeDeclarationTable(type.declaration, sdkVersion)}
        {signature ? (
          <div key={`type-definition-signature-${signature.name}`}>
            <APICommentTextBlock comment={signature.comment} />
            {signature.parameters && renderParams(signature.parameters, sdkVersion)}
          </div>
        ) : null}
        {signature?.type && (
          <div
            className={mergeClasses(
              VERTICAL_SPACING,
              ELEMENT_SPACING,
              'mt-3.5 flex flex-row items-start gap-2'
            )}>
            <div className="flex flex-row items-center gap-2">
              <CornerDownRightIcon className="icon-sm relative -mt-0.5 inline-block text-icon-tertiary" />
              <span className={STYLES_SECONDARY}>Returns:</span>
            </div>
            <CALLOUT>
              <APIDataType typeDefinition={signature.type} sdkVersion={sdkVersion} />
            </CALLOUT>
          </div>
        )}
      </div>
    );
  } else if (type.elements) {
    return (
      <div key={`type-tuple-${name}`} className={STYLES_APIBOX}>
        <APISectionDeprecationNote comment={comment} sticky />
        <APIBoxHeader name={name} comment={comment} />
        <APICommentTextBlock comment={comment} includePlatforms={false} />
        <CALLOUT className={mergeClasses(STYLES_SECONDARY, VERTICAL_SPACING)}>
          Tuple: <CODE>{resolveTypeName(type, sdkVersion)}</CODE>
        </CALLOUT>
      </div>
    );
  } else if (type.types && ['union', 'intersection'].includes(type.type)) {
    const literalTypes = type.types.filter((t: TypeDefinitionData) =>
      ['literal', 'templateLiteral', 'intrinsic', 'reference', 'tuple'].includes(t.type)
    );
    const propTypes = type.types.filter((t: TypeDefinitionData) => t.type === 'reflection');
    const propMethodDefinitions = propTypes.filter(
      (t: TypeDefinitionData) => t.declaration?.signatures?.length
    );
    const propObjectDefinitions = propTypes.filter(type => !propMethodDefinitions.includes(type));

    if (propTypes.length) {
      return (
        <div key={`prop-type-definition-${name}`} className={STYLES_APIBOX}>
          <APISectionDeprecationNote comment={comment} sticky />
          <APIBoxHeader name={name} comment={comment} />
          <APICommentTextBlock comment={comment} includePlatforms={false} />
          {type.type === 'intersection' || type.type === 'union' ? (
            <CALLOUT className={mergeClasses(STYLES_SECONDARY, VERTICAL_SPACING, ELEMENT_SPACING)}>
              Type:{' '}
              {type.types
                .filter(type =>
                  ['reference', 'union', 'intersection', 'intrinsic', 'literal'].includes(type.type)
                )
                .map(validType => (
                  <Fragment key={`nested-reference-type-${validType.name}`}>
                    <CODE className="text-default">{resolveTypeName(validType, sdkVersion)}</CODE>
                    {type.type === 'union' ? ' or ' : ' '}
                  </Fragment>
                ))}
              {type.type === 'union'
                ? propMethodDefinitions.length > 2
                  ? 'An anonymous method defined as described below'
                  : 'Object shaped as below'
                : 'extended by'}
              :
            </CALLOUT>
          ) : null}
          {propObjectDefinitions.map(
            (propType, index) =>
              propType.declaration &&
              renderTypeDeclarationTable(propType.declaration, sdkVersion, index)
          )}
          {propMethodDefinitions.map(
            propType =>
              propType.declaration && renderTypeMethodEntry(propType.declaration, sdkVersion)
          )}
        </div>
      );
    } else if (literalTypes.length) {
      const acceptedLiteralTypes = defineLiteralType(literalTypes);
      return (
        <div key={`type-definition-${name}`} className={STYLES_APIBOX}>
          <APISectionDeprecationNote comment={comment} sticky />
          <APIBoxHeader name={name} comment={comment} />
          <CALLOUT className={mergeClasses(VERTICAL_SPACING, 'mb-3')}>
            <span className={STYLES_SECONDARY}>Literal Type: </span>
            {acceptedLiteralTypes ?? 'multiple types'}
          </CALLOUT>
          <APICommentTextBlock comment={comment} includePlatforms={false} />
          <CALLOUT className={mergeClasses(STYLES_SECONDARY, VERTICAL_SPACING, ELEMENT_SPACING)}>
            Acceptable values are:{' '}
            {literalTypes.map((lt, index) => (
              <Fragment key={`${name}-literal-type-${index}`}>
                <CODE>{resolveTypeName(lt, sdkVersion)}</CODE>
                {index + 1 !== literalTypes.length ? (
                  <span className="text-quaternary"> | </span>
                ) : null}
              </Fragment>
            ))}
          </CALLOUT>
        </div>
      );
    }
  } else if (
    (type.name === 'Record' && type.typeArguments) ||
    ['array', 'reference'].includes(type.type)
  ) {
    return (
      <div key={`record-definition-${name}`} className={mergeClasses(STYLES_APIBOX)}>
        <APISectionDeprecationNote comment={comment} sticky />
        <APIBoxHeader name={name} comment={comment} />
        <CALLOUT className={mergeClasses(VERTICAL_SPACING, 'mb-3')}>
          <span className={STYLES_SECONDARY}>Type: </span>
          <APIDataType typeDefinition={type} sdkVersion={sdkVersion} />
        </CALLOUT>
        <APICommentTextBlock comment={comment} includePlatforms={false} />
      </div>
    );
  } else if (type.type === 'intrinsic') {
    return (
      <div key={`generic-type-definition-${name}`} className={STYLES_APIBOX}>
        <APISectionDeprecationNote comment={comment} sticky />
        <APIBoxHeader name={name} comment={comment} />
        <APICommentTextBlock comment={comment} includePlatforms={false} />
        <CALLOUT className={mergeClasses(VERTICAL_SPACING, ELEMENT_SPACING)}>
          <span className={STYLES_SECONDARY}>Type: </span>
          <CODE>{type.name}</CODE>
        </CALLOUT>
      </div>
    );
  } else if (type.type === 'conditional' && type.checkType) {
    return (
      <div key={`conditional-type-definition-${name}`} className={STYLES_APIBOX}>
        <APISectionDeprecationNote comment={comment} sticky />
        <APIBoxHeader name={`${name}<${type.checkType.name}>`} comment={comment} />
        <APICommentTextBlock comment={comment} includePlatforms={false} />
        <CALLOUT className={VERTICAL_SPACING}>
          <span className={STYLES_SECONDARY}>Generic: </span>
          <CODE>
            {type.checkType.name}
            {typeParameter && <> extends {resolveTypeName(typeParameter[0].type, sdkVersion)}</>}
          </CODE>
        </CALLOUT>
        <CALLOUT className={VERTICAL_SPACING}>
          <span className={STYLES_SECONDARY}>Type: </span>
          <CODE>
            {type.checkType.name}
            {typeParameter && (
              <> extends {type.extendsType && resolveTypeName(type.extendsType, sdkVersion)}</>
            )}
            {' ? '}
            {type.trueType && resolveTypeName(type.trueType, sdkVersion)}
            {' : '}
            {type.falseType && resolveTypeName(type.falseType, sdkVersion)}
          </CODE>
        </CALLOUT>
      </div>
    );
  } else if (type.type === 'templateLiteral' && type.tail) {
    const possibleData = [type.head ?? '', ...type.tail.flat()].filter(
      entry => typeof entry !== 'string'
    );

    if (possibleData.length === 0 || typeof possibleData[0] === 'string') {
      return undefined;
    }

    return (
      <div key={`conditional-type-definition-${name}`} className={STYLES_APIBOX}>
        <APISectionDeprecationNote comment={comment} sticky />
        <APIBoxHeader name={name} comment={comment} />
        <APICommentTextBlock comment={comment} includePlatforms={false} />
        <CALLOUT className={VERTICAL_SPACING}>
          String union of <CODE>{resolveTypeName(possibleData[0], sdkVersion)}</CODE> values.
        </CALLOUT>
      </div>
    );
  }
  return undefined;
};

const APISectionTypes = ({ data, sdkVersion }: APISectionTypesProps) =>
  data?.length ? (
    <>
      <H2 key="types-header">Types</H2>
      {data.map(d => renderType(d, sdkVersion))}
    </>
  ) : null;

export default APISectionTypes;
