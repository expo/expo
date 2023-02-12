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
  getTagData,
  getTagNamesList,
  H3Code,
  H4Code,
  renderTypeOrSignatureType,
  resolveTypeName,
  STYLES_APIBOX,
  STYLES_APIBOX_NESTED,
  STYLES_ELEMENT_SPACING,
  STYLES_NESTED_SECTION_HEADER,
  STYLES_NOT_EXPOSED_HEADER,
  STYLES_SECONDARY,
  TypeDocKind,
} from '~/components/plugins/api/APISectionUtils';
import { CODE, H2, H3, H4, LI, P, UL } from '~/ui/components/Text';

export type APISectionPropsProps = {
  data: PropsDefinitionData[];
  defaultProps?: DefaultPropsDefinitionData;
  header?: string;
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
  if (def.kind === TypeDocKind.TypeAlias) {
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
    <div key={`props-definition-${def.name}`}>
      {propsDeclarations?.map(prop =>
        prop
          ? renderProp(prop, extractDefaultPropValue(prop, defaultValues), exposeInSidebar)
          : null
      )}
      {renderInheritedProps(def, exposeInSidebar)}
    </div>
  );
};

export const renderProp = (
  { comment, name, type, flags, signatures }: PropData,
  defaultValue?: string,
  exposeInSidebar?: boolean
) => {
  const HeaderComponent = exposeInSidebar ? H3Code : H4Code;
  const extractedSignatures = signatures || type?.declaration?.signatures;
  const extractedComment = getCommentOrSignatureComment(comment, extractedSignatures);
  return (
    <div key={`prop-entry-${name}`} css={[STYLES_APIBOX, STYLES_APIBOX_NESTED]}>
      <APISectionDeprecationNote comment={extractedComment} />
      <APISectionPlatformTags comment={comment} prefix="Only for:" />
      <HeaderComponent tags={getTagNamesList(comment)}>
        <CODE css={!exposeInSidebar ? STYLES_NOT_EXPOSED_HEADER : undefined}>{name}</CODE>
      </HeaderComponent>
      <P css={extractedComment && STYLES_ELEMENT_SPACING}>
        {flags?.isOptional && <span css={STYLES_SECONDARY}>Optional&emsp;&bull;&emsp;</span>}
        <span css={STYLES_SECONDARY}>Type:</span>{' '}
        {renderTypeOrSignatureType(type, extractedSignatures)}
        {defaultValue && defaultValue !== UNKNOWN_VALUE ? (
          <span>
            <span css={STYLES_SECONDARY}>&emsp;&bull;&emsp;Default:</span>{' '}
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
  return data?.length ? (
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
