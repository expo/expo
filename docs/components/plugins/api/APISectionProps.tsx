import { mergeClasses } from '@expo/styleguide';
import { Fragment } from 'react';

import { APIBoxHeader } from '~/components/plugins/api/components/APIBoxHeader';
import { APIBoxSectionHeader } from '~/components/plugins/api/components/APIBoxSectionHeader';
import { APIParamDetailsBlock } from '~/components/plugins/api/components/APIParamDetailsBlock';
import { APITypeOrSignatureType } from '~/components/plugins/api/components/APITypeOrSignatureType';
import { CALLOUT, CODE, H2, H3, H4, LI, UL } from '~/ui/components/Text';

import {
  CommentTagData,
  DefaultPropsDefinitionData,
  PropData,
  PropsDefinitionData,
  TypeDefinitionData,
  TypeDocKind,
} from './APIDataTypes';
import { APISectionDeprecationNote } from './APISectionDeprecationNote';
import {
  defineLiteralType,
  extractDefaultPropValue,
  getAllTagData,
  getCommentOrSignatureComment,
  getTagData,
  resolveTypeName,
} from './APISectionUtils';
import { APICommentTextBlock } from './components/APICommentTextBlock';
import { ELEMENT_SPACING, STYLES_SECONDARY, VERTICAL_SPACING } from './styles';

export type APISectionPropsProps = {
  data: PropsDefinitionData[];
  sdkVersion: string;
  defaultProps?: DefaultPropsDefinitionData;
  parentPlatforms?: CommentTagData[];
  header?: string;
};

export type RenderPropOptions = {
  exposeInSidebar?: boolean;
  baseNestingLevel?: number;
};

const UNKNOWN_VALUE = '...';
const renderInheritedProp = (ip: TypeDefinitionData, sdkVersion: string) => {
  return (
    <LI key={`inherited-prop-${ip.name}-${ip.type}`}>
      <CODE>{resolveTypeName(ip, sdkVersion)}</CODE>
    </LI>
  );
};

const renderInheritedProps = (
  data: PropsDefinitionData | undefined,
  sdkVersion: string,
  exposeInSidebar?: boolean
) => {
  const inheritedData = data?.type?.types ?? data?.extendedTypes ?? [];
  const inheritedProps =
    inheritedData.filter((ip: TypeDefinitionData) => ip.type === 'reference') ?? [];
  if (inheritedProps.length > 0) {
    return (
      <div className={mergeClasses('border-t border-palette-gray4 px-4 py-3')}>
        {exposeInSidebar ? <H3>Inherited Props</H3> : <H4>Inherited Props</H4>}
        <UL>{inheritedProps.map(prop => renderInheritedProp(prop, sdkVersion))}</UL>
      </div>
    );
  }
  return undefined;
};

const getPropsBaseTypes = (def: PropsDefinitionData) => {
  if (def.kind === TypeDocKind.TypeAlias || def.kind === TypeDocKind.TypeAlias_Legacy) {
    const baseTypes = def?.type?.types
      ? def.type.types?.filter((t: TypeDefinitionData) => t.declaration)
      : [def.type];
    return baseTypes.map(def => def?.declaration?.children);
  } else if (def.kind === TypeDocKind.Interface) {
    return def.children?.filter(child => !child.inheritedFrom) ?? [];
  }
  return [];
};

const renderProps = (
  def: PropsDefinitionData,
  sdkVersion: string,
  defaultValues?: DefaultPropsDefinitionData,
  parentPlatforms?: CommentTagData[],
  exposeInSidebar?: boolean
) => {
  const propsDeclarations = getPropsBaseTypes(def)
    .flat()
    .filter((dec, i, arr) => arr.findIndex(t => t?.name === dec?.name) === i);

  return (
    <div key={`props-definition-${def.name}`} className="[&>*]:last:!mb-0">
      {propsDeclarations?.map(prop =>
        prop
          ? renderProp(
              prop,
              sdkVersion,
              extractDefaultPropValue(prop, defaultValues),
              parentPlatforms,
              {
                exposeInSidebar,
              }
            )
          : null
      )}
      {renderInheritedProps(def, sdkVersion, exposeInSidebar)}
    </div>
  );
};

export const renderProp = (
  propData: PropData,
  sdkVersion: string,
  defaultValue?: string,
  parentPlatforms?: CommentTagData[],
  { exposeInSidebar, ...options }: RenderPropOptions = {}
) => {
  const { comment, name, type, flags, signatures } = { ...propData, ...propData.getSignature };
  const baseNestingLevel = options.baseNestingLevel ?? (exposeInSidebar ? 3 : 4);
  const extractedSignatures = signatures ?? type?.declaration?.signatures;
  const extractedComment = getCommentOrSignatureComment(comment, extractedSignatures);
  const platforms = getAllTagData('platform', extractedComment);

  const isLiteralType =
    type?.type && ['literal', 'templateLiteral', 'union', 'tuple'].includes(type.type);
  const definedLiteralGeneric =
    isLiteralType && type?.types ? defineLiteralType(type.types) : undefined;

  return (
    <div
      key={`prop-entry-${name}`}
      className={mergeClasses('border-t border-palette-gray4 first:border-t-0')}>
      <APISectionDeprecationNote comment={extractedComment} className="mx-4 mb-0 mt-3" />
      <APIBoxHeader
        name={name}
        comment={extractedComment}
        baseNestingLevel={baseNestingLevel}
        deprecated={Boolean(getTagData('deprecated', extractedComment))}
        platforms={platforms.length > 0 ? platforms : parentPlatforms}
      />
      <div className={mergeClasses(STYLES_SECONDARY, VERTICAL_SPACING, 'mb-2.5')}>
        {flags?.isOptional && <>Optional&emsp;&bull;&emsp;</>}
        {flags?.isReadonly && <>Read Only&emsp;&bull;&emsp;</>}
        {definedLiteralGeneric && <>Literal type: {definedLiteralGeneric}</>}
        {!isLiteralType && (
          <>
            Type:{' '}
            <APITypeOrSignatureType
              type={type}
              signatures={extractedSignatures}
              sdkVersion={sdkVersion}
            />
          </>
        )}
        {defaultValue && defaultValue !== UNKNOWN_VALUE && (
          <>
            &emsp;&bull;&emsp;Default: <CODE>{defaultValue}</CODE>
          </>
        )}
      </div>
      <APICommentTextBlock comment={extractedComment} includePlatforms={false} inlineHeaders />
      {extractedSignatures?.length &&
        extractedSignatures[0].parameters?.map(param => (
          <APIParamDetailsBlock
            key={param.name}
            param={param}
            sdkVersion={sdkVersion}
            className={mergeClasses(VERTICAL_SPACING, ELEMENT_SPACING)}
          />
        ))}
      {type?.types && isLiteralType && (
        <CALLOUT className={mergeClasses(STYLES_SECONDARY, VERTICAL_SPACING, ELEMENT_SPACING)}>
          Acceptable values are:{' '}
          {type.types.map((lt, index, arr) => (
            <Fragment key={`${name}-literal-type-${index}`}>
              <CODE className="mb-px">{resolveTypeName(lt, sdkVersion)}</CODE>
              {index + 1 !== arr.length && <span className="text-quaternary"> | </span>}
            </Fragment>
          ))}
        </CALLOUT>
      )}
    </div>
  );
};

const APISectionProps = ({
  data,
  defaultProps,
  parentPlatforms,
  header = 'Props',
  sdkVersion,
}: APISectionPropsProps) => {
  if (!data?.length) {
    return null;
  }

  const baseProp = data.find(prop => prop.name === header);

  return (
    <>
      {header === 'Props' ? (
        <H2 key="props-header">{header}</H2>
      ) : (
        <div>
          {baseProp && <APISectionDeprecationNote comment={baseProp.comment} />}
          {baseProp?.comment && (
            <APICommentTextBlock comment={baseProp.comment} includePlatforms={!parentPlatforms} />
          )}
          <APIBoxSectionHeader text={header} exposeInSidebar baseNestingLevel={99} />
        </div>
      )}
      {data.map((propsDefinition: PropsDefinitionData) =>
        renderProps(propsDefinition, sdkVersion, defaultProps, parentPlatforms, header === 'Props')
      )}
    </>
  );
};

export default APISectionProps;
