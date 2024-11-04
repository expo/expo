import { mergeClasses } from '@expo/styleguide';

import {
  DefaultPropsDefinitionData,
  PropData,
  PropsDefinitionData,
  TypeDefinitionData,
} from './APIDataTypes';
import { APISectionDeprecationNote } from './APISectionDeprecationNote';
import { APISectionPlatformTags } from './APISectionPlatformTags';
import {
  BoxSectionHeader,
  CommentTextBlock,
  extractDefaultPropValue,
  getCommentOrSignatureComment,
  getH3CodeWithBaseNestingLevel,
  getTagNamesList,
  renderTypeOrSignatureType,
  resolveTypeName,
  TypeDocKind,
} from './APISectionUtils';
import { ELEMENT_SPACING, STYLES_APIBOX, STYLES_APIBOX_NESTED, STYLES_SECONDARY } from './styles';

import { CODE, H2, H3, H4, LI, MONOSPACE, P, UL } from '~/ui/components/Text';

export type APISectionPropsProps = {
  data: PropsDefinitionData[];
  sdkVersion: string;
  defaultProps?: DefaultPropsDefinitionData;
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
): JSX.Element | undefined => {
  const inheritedData = data?.type?.types ?? data?.extendedTypes ?? [];
  const inheritedProps =
    inheritedData.filter((ip: TypeDefinitionData) => ip.type === 'reference') ?? [];
  if (inheritedProps.length) {
    return (
      <>
        {exposeInSidebar ? <H3>Inherited Props</H3> : <H4>Inherited Props</H4>}
        <UL>{inheritedProps.map(i => renderInheritedProp(i, sdkVersion))}</UL>
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
  sdkVersion: string,
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
          ? renderProp(prop, sdkVersion, extractDefaultPropValue(prop, defaultValues), {
              exposeInSidebar,
            })
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
  { exposeInSidebar, ...options }: RenderPropOptions = {}
) => {
  const { comment, name, type, flags, signatures } = { ...propData, ...propData.getSignature };
  const baseNestingLevel = options.baseNestingLevel ?? (exposeInSidebar ? 3 : 4);
  const HeaderComponent = getH3CodeWithBaseNestingLevel(baseNestingLevel);
  const extractedSignatures = signatures || type?.declaration?.signatures;
  const extractedComment = getCommentOrSignatureComment(comment, extractedSignatures);

  return (
    <div
      key={`prop-entry-${name}`}
      className={mergeClasses(STYLES_APIBOX, STYLES_APIBOX_NESTED, '!pb-4 [&>*:last-child]:!mb-0')}>
      <APISectionDeprecationNote comment={extractedComment} sticky />
      <APISectionPlatformTags comment={comment} />
      <HeaderComponent tags={getTagNamesList(comment)}>
        <MONOSPACE
          weight="medium"
          className={mergeClasses(
            'wrap-anywhere',
            !exposeInSidebar && 'mb-1 inline-block prose-code:mb-0'
          )}>
          {name}
        </MONOSPACE>
      </HeaderComponent>
      <P className={mergeClasses(extractedComment && ELEMENT_SPACING)}>
        {flags?.isOptional && <span className={STYLES_SECONDARY}>Optional&emsp;&bull;&emsp;</span>}
        {flags?.isReadonly && <span className={STYLES_SECONDARY}>Read Only&emsp;&bull;&emsp;</span>}
        <span className={STYLES_SECONDARY}>Type:</span>{' '}
        {renderTypeOrSignatureType({ type, signatures: extractedSignatures, sdkVersion })}
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

const APISectionProps = ({
  data,
  defaultProps,
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
          <BoxSectionHeader
            text={header}
            className="!text-secondary !font-medium"
            exposeInSidebar
            baseNestingLevel={99}
          />
          {baseProp && baseProp.comment && <CommentTextBlock comment={baseProp.comment} />}
        </div>
      )}
      {data.map((propsDefinition: PropsDefinitionData) =>
        renderProps(propsDefinition, sdkVersion, defaultProps, header === 'Props')
      )}
    </>
  );
};

export default APISectionProps;
