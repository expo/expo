import { css } from '@emotion/react';
import { shadows, theme, typography } from '@expo/styleguide';
import { borderRadius, breakpoints, spacing } from '@expo/styleguide-base';
import type { ComponentProps, ComponentType } from 'react';
import { Fragment } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { APIDataType } from './APIDataType';

import { HeadingType } from '~/common/headingManager';
import { Code as PrismCodeBlock } from '~/components/base/code';
import {
  CommentContentData,
  CommentData,
  MethodDefinitionData,
  MethodParamData,
  MethodSignatureData,
  PropData,
  TypeDefinitionData,
  TypePropertyDataFlags,
  TypeSignaturesData,
} from '~/components/plugins/api/APIDataTypes';
import { APISectionPlatformTags } from '~/components/plugins/api/APISectionPlatformTags';
import { Callout } from '~/ui/components/Callout';
import { Cell, HeaderCell, Row, Table, TableHead } from '~/ui/components/Table';
import { tableWrapperStyle } from '~/ui/components/Table/Table';
import { Tag } from '~/ui/components/Tag';
import {
  A,
  BOLD,
  CODE,
  H4,
  LI,
  OL,
  P,
  RawH3,
  RawH4,
  UL,
  createPermalinkedComponent,
  DEMI,
  CALLOUT,
  createTextComponent,
} from '~/ui/components/Text';
import { TextElement } from '~/ui/components/Text/types';

const isDev = process.env.NODE_ENV === 'development';

export enum TypeDocKind {
  Namespace = 4,
  Enum = 8,
  Variable = 32,
  Function = 64,
  Class = 128,
  Interface = 256,
  Property = 1024,
  Method = 2048,
  Parameter = 32768,
  Accessor = 262144,
  TypeAlias = 4194304,
}

export type MDComponents = ComponentProps<typeof ReactMarkdown>['components'];

const getInvalidLinkMessage = (href: string) =>
  `Using "../" when linking other packages in doc comments produce a broken link! Please use "./" instead. Problematic link:\n\t${href}`;

export const mdComponents: MDComponents = {
  blockquote: ({ children }) => <Callout>{children}</Callout>,
  code: ({ children, className }) =>
    className ? (
      <PrismCodeBlock className={className}>{children}</PrismCodeBlock>
    ) : (
      <CODE css={css({ display: 'inline' })}>{children}</CODE>
    ),
  h1: ({ children }) => <H4>{children}</H4>,
  ul: ({ children }) => <UL className={ELEMENT_SPACING}>{children}</UL>,
  ol: ({ children }) => <OL className={ELEMENT_SPACING}>{children}</OL>,
  li: ({ children }) => <LI>{children}</LI>,
  a: ({ href, children }) => {
    if (
      href?.startsWith('../') &&
      !href?.startsWith('../..') &&
      !href?.startsWith('../react-native')
    ) {
      if (isDev) {
        throw new Error(getInvalidLinkMessage(href));
      } else {
        console.warn(getInvalidLinkMessage(href));
      }
    }
    return <A href={href}>{children}</A>;
  },
  p: ({ children }) => (children ? <P className={ELEMENT_SPACING}>{children}</P> : null),
  strong: ({ children }) => <BOLD>{children}</BOLD>,
  span: ({ children }) => (children ? <span>{children}</span> : null),
  table: ({ children }) => <Table>{children}</Table>,
  thead: ({ children }) => <TableHead>{children}</TableHead>,
  tr: ({ children }) => <Row>{children}</Row>,
  th: ({ children }) => <HeaderCell>{children}</HeaderCell>,
  td: ({ children }) => <Cell>{children}</Cell>,
};

export const mdComponentsNoValidation: MDComponents = {
  ...mdComponents,
  a: ({ href, children }) => <A href={href}>{children}</A>,
};

const nonLinkableTypes = [
  'ColorValue',
  'Component',
  'ComponentClass',
  'PureComponent',
  'E',
  'EventSubscription',
  'Listener',
  'NativeSyntheticEvent',
  'ParsedQs',
  'ServiceActionResult',
  'T',
  'TaskOptions',
  'Uint8Array',
  // React & React Native
  'React.FC',
  'ForwardRefExoticComponent',
  'StyleProp',
  'HTMLInputElement',
  // Cross-package permissions management
  'RequestPermissionMethod',
  'GetPermissionMethod',
  'Options',
  'PermissionHookBehavior',
];

/**
 * List of type names that should not be visible in the docs.
 */
const omittableTypes = [
  // Internal React type that adds `ref` prop to the component
  'RefAttributes',
];

/**
 * Map of internal names/type names that should be replaced with something more developer-friendly.
 */
const replaceableTypes: Partial<Record<string, string>> = {
  ForwardRefExoticComponent: 'Component',
};

const hardcodedTypeLinks: Record<string, string> = {
  AVPlaybackSource: '/versions/latest/sdk/av/#avplaybacksource',
  AVPlaybackStatus: '/versions/latest/sdk/av/#avplaybackstatus',
  AVPlaybackStatusToSet: '/versions/latest/sdk/av/#avplaybackstatustoset',
  Blob: 'https://developer.mozilla.org/en-US/docs/Web/API/Blob',
  Date: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date',
  DeviceSensor: '/versions/latest/sdk/sensors',
  Element: 'https://www.typescriptlang.org/docs/handbook/jsx.html#function-component',
  Error: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error',
  ExpoConfig:
    'https://github.com/expo/expo/blob/main/packages/%40expo/config-types/src/ExpoConfig.ts',
  File: 'https://developer.mozilla.org/en-US/docs/Web/API/File',
  FileList: 'https://developer.mozilla.org/en-US/docs/Web/API/FileList',
  Manifest: '/versions/latest/sdk/constants/#manifest',
  MediaTrackSettings: 'https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackSettings',
  MessageEvent: 'https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent',
  Omit: 'https://www.typescriptlang.org/docs/handbook/utility-types.html#omittype-keys',
  Pick: 'https://www.typescriptlang.org/docs/handbook/utility-types.html#picktype-keys',
  Partial: 'https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype',
  Promise:
    'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise',
  SyntheticEvent:
    'https://beta.reactjs.org/reference/react-dom/components/common#react-event-object',
  View: 'https://reactnative.dev/docs/view',
  ViewProps: 'https://reactnative.dev/docs/view#props',
  ViewStyle: 'https://reactnative.dev/docs/view-style-props',
  WebGL2RenderingContext: 'https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext',
  WebGLFramebuffer: 'https://developer.mozilla.org/en-US/docs/Web/API/WebGLFramebuffer',
};

const renderWithLink = (name: string, type?: string) => {
  const replacedName = replaceableTypes[name] ?? name;

  if (name.includes('.')) return name;

  return nonLinkableTypes.includes(replacedName) ? (
    replacedName + (type === 'array' ? '[]' : '')
  ) : (
    <A
      href={hardcodedTypeLinks[replacedName] || `#${replacedName.toLowerCase()}`}
      key={`type-link-${replacedName}`}>
      {replacedName}
      {type === 'array' && '[]'}
    </A>
  );
};

const renderUnion = (types: TypeDefinitionData[]) =>
  types
    .map(type => resolveTypeName(type))
    .map((valueToRender, index) => (
      <span key={`union-type-${index}`}>
        {valueToRender}
        {index + 1 !== types.length && ' | '}
      </span>
    ));

export const resolveTypeName = (
  typeDefinition: TypeDefinitionData
): string | JSX.Element | (string | JSX.Element)[] => {
  if (!typeDefinition) {
    return 'undefined';
  }

  const {
    elements,
    elementType,
    name,
    type,
    types,
    typeArguments,
    declaration,
    value,
    queryType,
    operator,
    objectType,
    indexType,
  } = typeDefinition;

  try {
    if (name) {
      if (type === 'reference') {
        if (typeArguments) {
          if (name === 'Record' || name === 'React.ComponentProps') {
            return (
              <>
                {name}&lt;
                {typeArguments.map((type, index) => (
                  <span key={`record-type-${index}`}>
                    {resolveTypeName(type)}
                    {index !== typeArguments.length - 1 ? ', ' : null}
                  </span>
                ))}
                &gt;
              </>
            );
          } else {
            return (
              <>
                {renderWithLink(name)}
                &lt;
                {typeArguments.map((type, index) => (
                  <span key={`${name}-nested-type-${index}`}>
                    {resolveTypeName(type)}
                    {index !== typeArguments.length - 1 ? ', ' : null}
                  </span>
                ))}
                &gt;
              </>
            );
          }
        } else {
          return renderWithLink(name);
        }
      } else {
        return name;
      }
    } else if (elementType?.name) {
      if (elementType.type === 'reference') {
        return renderWithLink(elementType.name, type);
      } else if (type === 'array') {
        return elementType.name + '[]';
      }
      return elementType.name + type;
    } else if (elementType?.declaration) {
      if (type === 'array') {
        const { parameters, type: paramType } = elementType.declaration.indexSignature || {};
        if (parameters && paramType) {
          return `{ [${listParams(parameters)}]: ${resolveTypeName(paramType)} }`;
        }
      }
      return elementType.name + type;
    } else if (type === 'union' && types?.length) {
      return renderUnion(types);
    } else if (elementType && elementType.type === 'union' && elementType?.types?.length) {
      const unionTypes = elementType?.types || [];
      return (
        <>
          ({renderUnion(unionTypes)}){type === 'array' && '[]'}
        </>
      );
    } else if (declaration?.signatures) {
      const baseSignature = declaration.signatures[0];
      if (baseSignature?.parameters?.length) {
        return (
          <>
            (
            {baseSignature.parameters?.map((param, index) => (
              <span key={`param-${index}-${param.name}`}>
                {param.name}: {resolveTypeName(param.type)}
                {index + 1 !== baseSignature.parameters?.length && ', '}
              </span>
            ))}
            ) {'=>'} {resolveTypeName(baseSignature.type)}
          </>
        );
      } else {
        return (
          <>
            {'() =>'} {resolveTypeName(baseSignature.type)}
          </>
        );
      }
    } else if (type === 'reflection' && declaration?.children) {
      return (
        <>
          {'{\n'}
          {declaration?.children.map((child: PropData, i) => (
            <span key={`reflection-${name}-${i}`}>
              {'  '}
              {child.name + ': '}
              {resolveTypeName(child.type)}
              {i + 1 !== declaration?.children?.length ? ', ' : null}
              {'\n'}
            </span>
          ))}
          {'}'}
        </>
      );
    } else if (type === 'tuple' && elements) {
      return (
        <>
          [
          {elements.map((elem, i) => (
            <span key={`tuple-${name}-${i}`}>
              {resolveTypeName(elem)}
              {i + 1 !== elements.length ? ', ' : null}
            </span>
          ))}
          ]
        </>
      );
    } else if (type === 'query' && queryType) {
      return queryType.name;
    } else if (type === 'literal' && typeof value === 'boolean') {
      return `${value}`;
    } else if (type === 'literal' && (value || (typeof value === 'number' && value === 0))) {
      return `'${value}'`;
    } else if (type === 'intersection' && types) {
      return types
        .filter(({ name }) => !omittableTypes.includes(name ?? ''))
        .map((value, index, array) => (
          <span key={`intersection-${name}-${index}`}>
            {resolveTypeName(value)}
            {index + 1 !== array.length && ' & '}
          </span>
        ));
    } else if (type === 'indexedAccess') {
      return `${objectType?.name}['${indexType?.value}']`;
    } else if (type === 'typeOperator') {
      return operator || 'undefined';
    } else if (type === 'intrinsic') {
      return name || 'undefined';
    } else if (value === null) {
      return 'null';
    }
    return 'undefined';
  } catch (e) {
    console.warn('Type resolve has failed!', e);
    return 'undefined';
  }
};

export const parseParamName = (name: string) => (name.startsWith('__') ? name.substr(2) : name);

export const renderParamRow = ({
  comment,
  name,
  type,
  flags,
  defaultValue,
}: MethodParamData): JSX.Element => {
  const defaultData = getTagData('default', comment);
  const initValue = parseCommentContent(
    defaultValue || (defaultData ? getCommentContent(defaultData.content) : '')
  );
  return (
    <Row key={`param-${name}`}>
      <Cell>
        <BOLD>{parseParamName(name)}</BOLD>
        {renderFlags(flags, initValue)}
      </Cell>
      <Cell>
        <APIDataType typeDefinition={type} />
      </Cell>
      <Cell>
        <CommentTextBlock
          comment={comment}
          afterContent={renderDefaultValue(initValue)}
          emptyCommentFallback="-"
        />
      </Cell>
    </Row>
  );
};

export const ParamsTableHeadRow = () => (
  <TableHead>
    <Row>
      <HeaderCell>Name</HeaderCell>
      <HeaderCell>Type</HeaderCell>
      <HeaderCell>Description</HeaderCell>
    </Row>
  </TableHead>
);

const InheritPermalink = createPermalinkedComponent(
  createTextComponent(
    TextElement.SPAN,
    css({ fontSize: 'inherit', fontWeight: 'inherit', color: 'inherit' })
  ),
  { baseNestingLevel: 2 }
);

export const BoxSectionHeader = ({
  text,
  exposeInSidebar,
}: {
  text: string;
  exposeInSidebar?: boolean;
}) => {
  const TextWrapper = exposeInSidebar ? InheritPermalink : Fragment;
  return (
    <CALLOUT theme="secondary" weight="medium" css={STYLES_NESTED_SECTION_HEADER}>
      <TextWrapper>{text}</TextWrapper>
    </CALLOUT>
  );
};

export const renderParams = (parameters: MethodParamData[]) => (
  <Table>
    <ParamsTableHeadRow />
    <tbody>{parameters?.map(renderParamRow)}</tbody>
  </Table>
);

export const listParams = (parameters: MethodParamData[]) =>
  parameters ? parameters?.map(param => parseParamName(param.name)).join(', ') : '';

export const renderDefaultValue = (defaultValue?: string) =>
  defaultValue && defaultValue !== '...' ? (
    <div css={defaultValueContainerStyle}>
      <DEMI>Default:</DEMI> <CODE>{defaultValue}</CODE>
    </div>
  ) : undefined;

export const renderTypeOrSignatureType = (
  type?: TypeDefinitionData,
  signatures?: MethodSignatureData[] | TypeSignaturesData[],
  allowBlock: boolean = false
) => {
  if (signatures && signatures.length) {
    return (
      <CODE key={`signature-type-${signatures[0].name}`}>
        (
        {signatures?.map(({ parameters }) =>
          parameters?.map(param => (
            <span key={`signature-param-${param.name}`}>
              {param.name}
              {param.flags?.isOptional && '?'}: {resolveTypeName(param.type)}
            </span>
          ))
        )}
        ) =&gt; {signatures[0].type ? resolveTypeName(signatures[0].type) : 'void'}
      </CODE>
    );
  } else if (type) {
    if (allowBlock) {
      return <APIDataType typeDefinition={type} />;
    }
    return <CODE key={`signature-type-${type.name}`}>{resolveTypeName(type)}</CODE>;
  }
  return undefined;
};

export const renderFlags = (flags?: TypePropertyDataFlags, defaultValue?: string) =>
  (flags?.isOptional || defaultValue) && (
    <>
      <br />
      <span css={STYLES_OPTIONAL}>(optional)</span>
    </>
  );

export const renderIndexSignature = (kind: TypeDocKind) =>
  kind === TypeDocKind.Parameter && (
    <>
      <br />
      <A
        css={STYLES_OPTIONAL}
        href="https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures"
        openInNewTab
        isStyled>
        (index signature)
      </A>
    </>
  );

export type CommentTextBlockProps = {
  comment?: CommentData;
  components?: MDComponents;
  beforeContent?: JSX.Element;
  afterContent?: JSX.Element;
  includePlatforms?: boolean;
  inlineHeaders?: boolean;
  emptyCommentFallback?: string;
};

export const parseCommentContent = (content?: string): string =>
  content && content.length ? content.replace(/&ast;/g, '*').replace(/\t/g, '') : '';

export const getCommentOrSignatureComment = (
  comment?: CommentData,
  signatures?: MethodSignatureData[] | TypeSignaturesData[]
) => comment || (signatures && signatures[0]?.comment);

export const getTagData = (tagName: string, comment?: CommentData) =>
  getAllTagData(tagName, comment)?.[0];

export const getAllTagData = (tagName: string, comment?: CommentData) =>
  comment?.blockTags?.filter(tag => tag.tag.substring(1) === tagName);

export const getTagNamesList = (comment?: CommentData) =>
  comment && [
    ...(getAllTagData('platform', comment)?.map(platformData =>
      getCommentContent(platformData.content)
    ) || []),
    ...(getTagData('deprecated', comment) ? ['deprecated'] : []),
    ...(getTagData('experimental', comment) ? ['experimental'] : []),
  ];

export const getMethodName = (
  method: MethodDefinitionData,
  apiName?: string,
  name?: string,
  parameters?: MethodParamData[]
) => {
  const isProperty = method.kind === TypeDocKind.Property && !parameters?.length;
  const methodName = ((apiName && `${apiName}.`) ?? '') + (method.name || name);
  if (!isProperty) {
    return `${methodName}(${parameters ? listParams(parameters) : ''})`;
  }

  return methodName;
};

export const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

const PARAM_TAGS_REGEX = /@tag-\S*/g;

const getParamTags = (shortText?: string) => {
  if (!shortText || !shortText.includes('@tag-')) {
    return undefined;
  }
  return Array.from(shortText.matchAll(PARAM_TAGS_REGEX), match => match[0]);
};

export const getCommentContent = (content: CommentContentData[]) => {
  return content
    .map(entry => entry.text)
    .join('')
    .trim();
};

export const CommentTextBlock = ({
  comment,
  beforeContent,
  afterContent,
  includePlatforms = true,
  inlineHeaders = false,
  emptyCommentFallback,
}: CommentTextBlockProps) => {
  const content = comment && comment.summary ? getCommentContent(comment.summary) : undefined;

  if (emptyCommentFallback && (!comment || !content || !content.length)) {
    return <>{emptyCommentFallback}</>;
  }

  const paramTags = content ? getParamTags(content) : undefined;
  const parsedContent = (
    <ReactMarkdown components={mdComponents} remarkPlugins={[remarkGfm]}>
      {parseCommentContent(paramTags ? content?.replaceAll(PARAM_TAGS_REGEX, '') : content)}
    </ReactMarkdown>
  );

  const examples = getAllTagData('example', comment);
  const exampleText = examples?.map((example, index) => (
    <Fragment key={'example-' + index}>
      {inlineHeaders ? (
        <div css={STYLES_EXAMPLE_IN_TABLE}>
          <BOLD>Example</BOLD>
        </div>
      ) : (
        <BoxSectionHeader text="Example" />
      )}
      <ReactMarkdown components={mdComponents}>{getCommentContent(example.content)}</ReactMarkdown>
    </Fragment>
  ));

  const see = getTagData('see', comment);
  const seeText = see && (
    <Callout>
      <ReactMarkdown components={mdComponents}>
        {`**See:** ` + getCommentContent(see.content)}
      </ReactMarkdown>
    </Callout>
  );

  const hasPlatforms = (getAllTagData('platform', comment)?.length || 0) > 0;

  return (
    <>
      {includePlatforms && hasPlatforms && (
        <APISectionPlatformTags comment={comment} prefix="Only for:" />
      )}
      {paramTags && (
        <>
          <BOLD>Only for:&ensp;</BOLD>
          {paramTags.map(tag => (
            <Tag key={tag} name={tag.split('-')[1]} />
          ))}
        </>
      )}
      {beforeContent}
      {parsedContent}
      {afterContent}
      {seeText}
      {exampleText}
    </>
  );
};

const getMonospaceHeader = (element: ComponentType<any>) => {
  const level = parseInt(element?.displayName?.replace(/\D/g, '') ?? '0', 10);
  return createPermalinkedComponent(element, {
    baseNestingLevel: level !== 0 ? level : undefined,
    sidebarType: HeadingType.InlineCode,
  });
};

export const H3Code = getMonospaceHeader(RawH3);
export const H4Code = getMonospaceHeader(RawH4);

export const getComponentName = (name?: string, children: PropData[] = []) => {
  if (name && name !== 'default') return name;
  const ctor = children.filter((child: PropData) => child.name === 'constructor')[0];
  return ctor?.signatures?.[0]?.type?.name ?? 'default';
};

export const STYLES_APIBOX = css({
  borderRadius: borderRadius.md,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: theme.border.default,
  padding: spacing[5],
  boxShadow: shadows.xs,
  marginBottom: spacing[6],
  overflowX: 'hidden',

  h3: {
    marginBottom: spacing[2.5],
  },

  'h2, h3, h4': {
    marginTop: 0,
  },

  th: {
    color: theme.text.secondary,
    padding: `${spacing[3]}px ${spacing[4]}px`,
  },

  li: {
    marginBottom: 0,
  },

  [`.css-${tableWrapperStyle.name}`]: {
    boxShadow: 'none',
    marginBottom: 0,
  },

  [`@media screen and (max-width: ${breakpoints.medium + 124}px)`]: {
    paddingInline: spacing[4],
  },
});

export const STYLES_APIBOX_NESTED = css({
  boxShadow: 'none',
  marginBottom: spacing[4],
  padding: `${spacing[4]}px ${spacing[5]}px 0`,

  h4: {
    marginTop: 0,
  },
});

export const STYLES_APIBOX_WRAPPER = css({
  marginBottom: spacing[4],
  padding: `${spacing[4]}px ${spacing[5]}px 0`,

  [`.css-${tableWrapperStyle.name}:last-child`]: {
    marginBottom: spacing[4],
  },
});

export const STYLE_APIBOX_NO_SPACING = css({ marginBottom: -spacing[5] });

export const STYLES_NESTED_SECTION_HEADER = css({
  display: 'flex',
  borderTop: `1px solid ${theme.border.default}`,
  borderBottom: `1px solid ${theme.border.default}`,
  margin: `${spacing[4]}px -${spacing[5]}px ${spacing[4]}px`,
  padding: `${spacing[2.5]}px ${spacing[5]}px`,
  backgroundColor: theme.background.subtle,

  h4: {
    ...typography.fontSizes[16],
    fontWeight: 600,
    marginBottom: 0,
    marginTop: 0,
    color: theme.text.secondary,
  },
});

export const STYLES_NOT_EXPOSED_HEADER = css({
  marginBottom: spacing[1],
  display: 'inline-block',

  code: {
    marginBottom: 0,
  },
});

export const STYLES_OPTIONAL = css({
  color: theme.text.secondary,
  fontSize: '90%',
  paddingTop: 22,
});

export const STYLES_SECONDARY = css({
  color: theme.text.secondary,
  fontSize: '90%',
  fontWeight: 600,
});

const defaultValueContainerStyle = css({
  marginTop: spacing[2],
  marginBottom: spacing[2],

  '&:last-child': {
    marginBottom: 0,
  },
});

const STYLES_EXAMPLE_IN_TABLE = css({
  margin: `${spacing[2]}px 0`,
});

export const ELEMENT_SPACING = 'mb-4';
