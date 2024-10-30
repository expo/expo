import { mergeClasses } from '@expo/styleguide';
import { CornerDownRightIcon } from '@expo/styleguide-icons/outline/CornerDownRightIcon';
import { Fragment, ReactNode } from 'react';

import { APIDataType } from './APIDataType';
import {
  PropData,
  TypeDeclarationContentData,
  TypeDefinitionData,
  TypeGeneralData,
  TypeSignaturesData,
} from './APIDataTypes';
import { APISectionDeprecationNote } from './APISectionDeprecationNote';
import { APISectionPlatformTags } from './APISectionPlatformTags';
import {
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
  getTagNamesList,
  H3Code,
  getCommentContent,
  listParams,
} from './APISectionUtils';
import { STYLES_APIBOX } from './styles';

import { APIBox } from '~/components/plugins/APIBox';
import { Cell, Row, Table } from '~/ui/components/Table';
import { H2, BOLD, CODE, MONOSPACE, CALLOUT, SPAN, RawH4 } from '~/ui/components/Text';

export type APISectionTypesProps = {
  data: TypeGeneralData[];
  sdkVersion: string;
};

const defineLiteralType = (types: TypeDefinitionData[]): JSX.Element | null => {
  const uniqueTypes = Array.from(
    new Set(types.map((t: TypeDefinitionData) => t.value && typeof t.value))
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
    {index && index > 0 ? <br /> : undefined}
    <CommentTextBlock comment={comment} />
    <Table>
      <ParamsTableHeadRow />
      <tbody>
        {children?.map(prop => renderTypePropertyRow(prop, sdkVersion))}
        {indexSignature?.parameters &&
          indexSignature.parameters.map(param => renderTypePropertyRow(param, sdkVersion))}
      </tbody>
    </Table>
  </Fragment>
);

const renderTypeMethodEntry = (
  { children, signatures, comment }: TypeDeclarationContentData,
  sdkVersion: string
): ReactNode => {
  const baseSignature = signatures?.[0];

  if (baseSignature && baseSignature.type) {
    return (
      <APIBox
        key={`type-declaration-table-${children?.map(child => child.name).join('-')}`}
        className="!mb-0">
        <RawH4 className="!mb-3">
          <MONOSPACE>
            {`(${baseSignature.parameters ? listParams(baseSignature?.parameters) : ''})`}
            {` => `}
            {renderTypeOrSignatureType({ type: baseSignature.type, sdkVersion })}
          </MONOSPACE>
        </RawH4>
        <CommentTextBlock comment={comment} />
        <Table>
          <ParamsTableHeadRow mainCellLabel="Parameter" />
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
    defaultValue || (defaultTag ? getCommentContent(defaultTag.content) : undefined)
  );
  const commentData = getCommentOrSignatureComment(comment, signatures);
  const hasDeprecationNote = Boolean(getTagData('deprecated', comment));
  return (
    <Row key={name}>
      <Cell fitContent>
        <BOLD>{name}</BOLD>
        {renderFlags(flags, initValue)}
        {kind && renderIndexSignature(kind)}
      </Cell>
      <Cell fitContent>
        {renderTypeOrSignatureType({ type, signatures, allowBlock: true, sdkVersion })}
      </Cell>
      <Cell fitContent>
        <APISectionDeprecationNote comment={comment} />
        <CommentTextBlock
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
    return (
      <div key={`type-definition-${name}`} className={STYLES_APIBOX}>
        <APISectionDeprecationNote comment={comment} sticky />
        <APISectionPlatformTags comment={comment} />
        <H3Code tags={getTagNamesList(comment)} className="break-words wrap-anywhere">
          <MONOSPACE weight="medium">
            {name}
            {type.declaration.signatures ? '()' : ''}
          </MONOSPACE>
        </H3Code>
        <CommentTextBlock comment={comment} includePlatforms={false} />
        {type.declaration.children && renderTypeDeclarationTable(type.declaration, sdkVersion)}
        {type.declaration.signatures
          ? type.declaration.signatures.map(({ parameters, comment }: TypeSignaturesData) => (
              <div key={`type-definition-signature-${name}`}>
                <CommentTextBlock comment={comment} />
                {parameters && renderParams(parameters, sdkVersion)}
              </div>
            ))
          : null}
        {type.declaration.signatures && type.declaration.signatures[0].type && (
          <div className="flex flex-row gap-2 items-start mt-4">
            <div className="flex flex-row gap-2 items-center">
              <CornerDownRightIcon className="inline-block icon-sm text-icon-secondary" />
              <CALLOUT tag="span" theme="secondary" weight="medium">
                Returns:
              </CALLOUT>
            </div>
            <CALLOUT>
              <APIDataType
                typeDefinition={type.declaration.signatures[0].type}
                sdkVersion={sdkVersion}
              />
            </CALLOUT>
          </div>
        )}
      </div>
    );
  } else if (type.elements) {
    return (
      <div key={`type-tuple-${name}`} className={STYLES_APIBOX}>
        <APISectionDeprecationNote comment={comment} sticky />
        <APISectionPlatformTags comment={comment} />
        <H3Code tags={getTagNamesList(comment)} className="break-words wrap-anywhere">
          <MONOSPACE weight="medium">{name}</MONOSPACE>
        </H3Code>
        <CommentTextBlock comment={comment} includePlatforms={false} />
        <CALLOUT>
          <SPAN theme="secondary" weight="medium">
            Tuple:{' '}
          </SPAN>
          <CODE>{resolveTypeName(type, sdkVersion)}</CODE>
        </CALLOUT>
      </div>
    );
  } else if (type.types && ['union', 'intersection'].includes(type.type)) {
    const literalTypes = type.types.filter((t: TypeDefinitionData) =>
      ['literal', 'intrinsic', 'reference', 'tuple'].includes(t.type)
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
          <APISectionPlatformTags comment={comment} />
          <H3Code tags={getTagNamesList(comment)}>
            <MONOSPACE weight="medium" className="wrap-anywhere">
              {name}
            </MONOSPACE>
          </H3Code>
          <CommentTextBlock comment={comment} includePlatforms={false} />
          {type.type === 'intersection' || type.type === 'union' ? (
            <>
              <CALLOUT>
                <SPAN theme="secondary" weight="medium">
                  Type:{' '}
                </SPAN>
                {type.types
                  .filter(type =>
                    ['reference', 'union', 'intersection', 'intrinsic', 'literal'].includes(
                      type.type
                    )
                  )
                  .map(validType => (
                    <Fragment key={`nested-reference-type-${validType.name}`}>
                      <CODE className="text-default">{resolveTypeName(validType, sdkVersion)}</CODE>
                      {type.type === 'union' ? ' or ' : ' '}
                    </Fragment>
                  ))}
                <SPAN theme="secondary">
                  {type.type === 'union'
                    ? propMethodDefinitions.length > 2
                      ? 'an anonymous method defined as described below'
                      : 'object shaped as below'
                    : 'extended by'}
                  :
                </SPAN>
              </CALLOUT>
              <br />
            </>
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
          <APISectionPlatformTags comment={comment} />
          <H3Code tags={getTagNamesList(comment)}>
            <MONOSPACE weight="medium" className="wrap-anywhere">
              {name}
            </MONOSPACE>
          </H3Code>
          <CALLOUT className="mb-3">
            <SPAN theme="secondary" weight="medium">
              Literal Type:{' '}
            </SPAN>
            {acceptedLiteralTypes ?? 'multiple types'}
          </CALLOUT>
          <CommentTextBlock comment={comment} includePlatforms={false} />
          <CALLOUT>
            <SPAN theme="secondary" weight="medium">
              Acceptable values are:{' '}
            </SPAN>
            {literalTypes.map((lt, index) => (
              <span key={`${name}-literal-type-${index}`}>
                <CODE>{resolveTypeName(lt, sdkVersion)}</CODE>
                {index + 1 !== literalTypes.length ? (
                  <CALLOUT tag="span" theme="quaternary">
                    {' | '}
                  </CALLOUT>
                ) : (
                  ''
                )}
              </span>
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
      <div
        key={`record-definition-${name}`}
        className={mergeClasses(STYLES_APIBOX, '[&>*:last-child]:!mb-0')}>
        <APISectionDeprecationNote comment={comment} sticky />
        <APISectionPlatformTags comment={comment} />
        <H3Code tags={getTagNamesList(comment)}>
          <MONOSPACE weight="medium" className="wrap-anywhere">
            {name}
          </MONOSPACE>
        </H3Code>
        <CALLOUT className="mb-3">
          <SPAN theme="secondary" weight="medium">
            Type:{' '}
          </SPAN>
          <APIDataType typeDefinition={type} sdkVersion={sdkVersion} />
        </CALLOUT>
        <CommentTextBlock comment={comment} includePlatforms={false} />
      </div>
    );
  } else if (type.type === 'intrinsic') {
    return (
      <div key={`generic-type-definition-${name}`} className={STYLES_APIBOX}>
        <APISectionDeprecationNote comment={comment} sticky />
        <APISectionPlatformTags comment={comment} />
        <H3Code tags={getTagNamesList(comment)}>
          <MONOSPACE weight="medium" className="wrap-anywhere">
            {name}
          </MONOSPACE>
        </H3Code>
        <CommentTextBlock comment={comment} includePlatforms={false} />
        <CALLOUT>
          <SPAN theme="secondary" weight="medium">
            Type:{' '}
          </SPAN>
          <CODE>{type.name}</CODE>
        </CALLOUT>
      </div>
    );
  } else if (type.type === 'conditional' && type.checkType) {
    return (
      <div key={`conditional-type-definition-${name}`} className={STYLES_APIBOX}>
        <APISectionDeprecationNote comment={comment} sticky />
        <APISectionPlatformTags comment={comment} />
        <H3Code tags={getTagNamesList(comment)}>
          <MONOSPACE weight="medium" className="wrap-anywhere">
            {name}&lt;{type.checkType.name}&gt;
          </MONOSPACE>
        </H3Code>
        <CommentTextBlock comment={comment} includePlatforms={false} />
        <CALLOUT>
          <SPAN theme="secondary" weight="medium">
            Generic:{' '}
          </SPAN>
          <CODE>
            {type.checkType.name}
            {typeParameter && <> extends {resolveTypeName(typeParameter[0].type, sdkVersion)}</>}
          </CODE>
        </CALLOUT>
        <CALLOUT>
          <SPAN theme="secondary" weight="medium">
            Type:{' '}
          </SPAN>
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
        <APISectionPlatformTags comment={comment} />
        <H3Code tags={getTagNamesList(comment)}>
          <MONOSPACE weight="medium" className="wrap-anywhere">
            {name}
          </MONOSPACE>
        </H3Code>
        <CommentTextBlock comment={comment} includePlatforms={false} />
        <CALLOUT>
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
