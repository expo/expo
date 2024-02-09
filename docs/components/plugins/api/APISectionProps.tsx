import { mergeClasses } from '@expo/styleguide';

import { ELEMENT_SPACING, STYLES_SECONDARY } from './styles';

import {
  DefaultPropsDefinitionData,
  PropData,
  PropsDefinitionData,
  TypeDefinitionData,
} from '~/components/plugins/api/APIDataTypes';
import { APISectionDeprecationNote } from '~/components/plugins/api/APISectionDeprecationNote';
import { APISectionPlatformTags } from '~/components/plugins/api/APISectionPlatformTags';
import {
  CommentTextBlock,
  getCommentContent,
  getCommentOrSignatureComment,
  getH3CodeWithBaseNestingLevel,
  getTagData,
  getTagNamesList,
  renderTypeOrSignatureType,
  resolveTypeName,
  STYLES_APIBOX,
  STYLES_APIBOX_NESTED,
  STYLES_NESTED_SECTION_HEADER,
  STYLES_NOT_EXPOSED_HEADER,
  TypeDocKind,
} from '~/components/plugins/api/APISectionUtils';
import { CODE, H2, H3, H4, LI, MONOSPACE, P, UL } from '~/ui/components/Text';

export type APISectionPropsProps = {
  data: PropsDefinitionData[];
  defaultProps?: DefaultPropsDefinitionData;
  header?: string;
};

export type RenderPropOptions = {
  exposeInSidebar?: boolean;
  baseNestingLevel?: number;
};

const UNKNOWN_VALUE = '...';

const extractDefaultPropValue = (
  { comment, name }: PropData,
  defaultProps?: DefaultPropsDefinitionData
): string | undefined => {
  const annotationDefault = getTagData('default', comment);
  if (annotationDefault) {
    return getCommentContent(annotationDefault.content);
  }
  return defaultProps?.type?.declaration?.children?.filter(
    (defaultProp: PropData) => defaultProp.name === name
  )[0]?.defaultValue;
};

const renderInheritedProp = (ip: TypeDefinitionData) => {
  return (
    <LI key={`inherited-prop-${ip.name}-${ip.type}`}>
      <CODE>{resolveTypeName(ip)}</CODE>
    </LI>
  );
};

const renderInheritedProps = (
  data: PropsDefinitionData | undefined,
  exposeInSidebar?: boolean
): JSX.Element | undefined => {
  const inheritedData = data?.type?.types ?? data?.extendedTypes ?? [];
  const inheritedProps =
    inheritedData.filter((ip: TypeDefinitionData) => ip.type === 'reference') ?? [];
  if (inheritedProps.length) {
    return (
      <>
        {exposeInSidebar ? <H3>Inherited Props</H3> : <H4>Inherited Props</H4>}
        <UL>{inheritedProps.map(renderInheritedProp)}</UL>
      </>
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
  defaultValues?: DefaultPropsDefinitionData,
  exposeInSidebar?: boolean
): JSX.Element => {
  const propsDeclarations = getPropsBaseTypes(def)
    .flat()
    .filter((dec, i, arr) => arr.findIndex(t => t?.name === dec?.name) === i);

  return (
    <div key={`props-definition-${def.name}`} className="[&>*:last-child]:!mb-0">
      {propsDeclarations?.map(prop =>
        prop
          ? renderProp(prop, extractDefaultPropValue(prop, defaultValues), { exposeInSidebar })
          : null
      )}
      {renderInheritedProps(def, exposeInSidebar)}
    </div>
  );
};

export const renderProp = (
  { comment, name, type, flags, signatures }: PropData,
  defaultValue?: string,
  { exposeInSidebar, ...options }: RenderPropOptions = {}
) => {
  const baseNestingLevel = options.baseNestingLevel ?? (exposeInSidebar ? 3 : 4);
  const HeaderComponent = getH3CodeWithBaseNestingLevel(baseNestingLevel);
  const extractedSignatures = signatures || type?.declaration?.signatures;
  const extractedComment = getCommentOrSignatureComment(comment, extractedSignatures);

  return (
    <div
      key={`prop-entry-${name}`}
      css={[STYLES_APIBOX, STYLES_APIBOX_NESTED]}
      className="!pb-4 [&>*:last-child]:!mb-0">
      <APISectionDeprecationNote comment={extractedComment} />
      <APISectionPlatformTags comment={comment} />
      <HeaderComponent tags={getTagNamesList(comment)}>
        <MONOSPACE
          weight="medium"
          css={!exposeInSidebar && STYLES_NOT_EXPOSED_HEADER}
          className="wrap-anywhere">
          {name}
        </MONOSPACE>
      </HeaderComponent>
      <P className={mergeClasses(extractedComment && ELEMENT_SPACING)}>
        {flags?.isOptional && <span className={STYLES_SECONDARY}>Optional&emsp;&bull;&emsp;</span>}
        <span className={STYLES_SECONDARY}>Type:</span>{' '}
        {renderTypeOrSignatureType(type, extractedSignatures)}
        {defaultValue && defaultValue !== UNKNOWN_VALUE ? (
          <span>
            <span className={STYLES_SECONDARY}>&emsp;&bull;&emsp;Default:</span>{' '}
            <CODE>{defaultValue}</CODE>
          </span>
        ) : null}
      </P>
      <CommentTextBlock comment={extractedComment} includePlatforms={false} />
    </div>
  );
};

const APISectionProps = ({ data, defaultProps, header = 'Props' }: APISectionPropsProps) => {
  const baseProp = data.find(prop => prop.name === header);
  return data?.length > 0 ? (
    <>
      {data?.length === 1 || header === 'Props' ? (
        <H2 key="props-header">{header}</H2>
      ) : (
        <div>
          {baseProp && <APISectionDeprecationNote comment={baseProp.comment} />}
          <div css={STYLES_NESTED_SECTION_HEADER}>
            <H4 key={`${header}-props-header`}>{header}</H4>
          </div>
          {baseProp && baseProp.comment ? <CommentTextBlock comment={baseProp.comment} /> : null}
        </div>
      )}
      {data.map((propsDefinition: PropsDefinitionData) =>
        renderProps(propsDefinition, defaultProps, data?.length === 1 || header === 'Props')
      )}
    </>
  ) : null;
};

export default APISectionProps;
