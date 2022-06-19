import { css } from '@emotion/react';
import {
  theme,
  iconSize,
  spacing,
  AtSignIcon,
  AndroidIcon,
  AppleIcon,
  ExpoGoLogo,
  borderRadius,
  shadows,
} from '@expo/styleguide';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Code, InlineCode } from '~/components/base/code';
import { H4 } from '~/components/base/headings';
import Link from '~/components/base/link';
import { LI, UL } from '~/components/base/list';
import { B, P, Quote } from '~/components/base/paragraph';
import {
  CommentData,
  CommentTagData,
  MethodParamData,
  MethodSignatureData,
  PropData,
  TypeDefinitionData,
  TypePropertyDataFlags,
} from '~/components/plugins/api/APIDataTypes';
import * as Constants from '~/constants/theme';

const isDev = process.env.NODE_ENV === 'development';

export enum TypeDocKind {
  LegacyEnum = 4,
  Enum = 8,
  Variable = 32,
  Function = 64,
  Class = 128,
  Interface = 256,
  Property = 1024,
  Method = 2048,
  TypeAlias = 4194304,
}

export type MDComponents = React.ComponentProps<typeof ReactMarkdown>['components'];

const getInvalidLinkMessage = (href: string) =>
  `Using "../" when linking other packages in doc comments produce a broken link! Please use "./" instead. Problematic link:\n\t${href}`;

export const mdComponents: MDComponents = {
  blockquote: ({ children }) => (
    <Quote>
      {/* @ts-ignore - current implementation produce type issues, this would be fixed in docs redesign */}
      {children.map(child => (child?.props?.node?.tagName === 'p' ? child?.props.children : child))}
    </Quote>
  ),
  code: ({ children, className }) =>
    className ? <Code className={className}>{children}</Code> : <InlineCode>{children}</InlineCode>,
  h1: ({ children }) => <H4>{children}</H4>,
  ul: ({ children }) => <UL>{children}</UL>,
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
    return <Link href={href}>{children}</Link>;
  },
  p: ({ children }) => (children ? <P>{children}</P> : null),
  strong: ({ children }) => <B>{children}</B>,
  span: ({ children }) => (children ? <span>{children}</span> : null),
};

export const mdInlineComponents: MDComponents = {
  ...mdComponents,
  p: ({ children }) => (children ? <span>{children}</span> : null),
};

const nonLinkableTypes = [
  'ColorValue',
  'Component',
  'E',
  'EventSubscription',
  'File',
  'FileList',
  'Manifest',
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
  AVPlaybackSource: '/versions/latest/sdk/av/#playback-api',
  AVPlaybackStatus: '/versions/latest/sdk/av/#playback-status',
  AVPlaybackStatusToSet: '/versions/latest/sdk/av/#default-initial--avplaybackstatustoset',
  Date: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date',
  Element: 'https://www.typescriptlang.org/docs/handbook/jsx.html#function-component',
  Error: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error',
  ExpoConfig: 'https://github.com/expo/expo-cli/blob/main/packages/config-types/src/ExpoConfig.ts',
  MessageEvent: 'https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent',
  Omit: 'https://www.typescriptlang.org/docs/handbook/utility-types.html#omittype-keys',
  Pick: 'https://www.typescriptlang.org/docs/handbook/utility-types.html#picktype-keys',
  Partial: 'https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype',
  Promise:
    'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise',
  View: '/versions/latest/react-native/view',
  ViewProps: '/versions/latest/react-native/view#props',
  ViewStyle: '/versions/latest/react-native/view-style-props',
};

const renderWithLink = (name: string, type?: string) => {
  const replacedName = replaceableTypes[name] ?? name;

  return nonLinkableTypes.includes(replacedName) ? (
    replacedName + (type === 'array' ? '[]' : '')
  ) : (
    <Link
      href={hardcodedTypeLinks[replacedName] || `#${replacedName.toLowerCase()}`}
      key={`type-link-${replacedName}`}>
      {replacedName}
      {type === 'array' && '[]'}
    </Link>
  );
};

const renderUnion = (types: TypeDefinitionData[]) =>
  types.map(resolveTypeName).map((valueToRender, index) => (
    <span key={`union-type-${index}`}>
      {valueToRender}
      {index + 1 !== types.length && ' | '}
    </span>
  ));

export const resolveTypeName = ({
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
}: TypeDefinitionData): string | JSX.Element | (string | JSX.Element)[] => {
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
          {'{ '}
          {declaration?.children.map((child: PropData, i) => (
            <span key={`reflection-${name}-${i}`}>
              {child.name + ': ' + resolveTypeName(child.type)}
              {i + 1 !== declaration?.children?.length ? ', ' : null}
            </span>
          ))}
          {' }'}
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
    } else if (type === 'literal' && value) {
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

export const renderParam = ({ comment, name, type, flags }: MethodParamData): JSX.Element => (
  <LI key={`param-${name}`}>
    <B>
      {parseParamName(name)}
      {flags?.isOptional && '?'} (<InlineCode>{resolveTypeName(type)}</InlineCode>)
    </B>
    <CommentTextBlock comment={comment} components={mdInlineComponents} withDash />
  </LI>
);

export const listParams = (parameters: MethodParamData[]) =>
  parameters ? parameters?.map(param => parseParamName(param.name)).join(', ') : '';

export const renderTypeOrSignatureType = (
  type?: TypeDefinitionData,
  signatures?: MethodSignatureData[],
  includeParamType: boolean = false
) => {
  if (type) {
    return <InlineCode key={`signature-type-${type.name}`}>{resolveTypeName(type)}</InlineCode>;
  } else if (signatures && signatures.length) {
    return signatures.map(({ name, type, parameters }) => (
      <InlineCode key={`signature-type-${name}`}>
        (
        {parameters && includeParamType
          ? parameters.map(param => (
              <span key={`signature-param-${param.name}`}>
                {param.name}
                {param.flags?.isOptional && '?'}: {resolveTypeName(param.type)}
              </span>
            ))
          : listParams(parameters)}
        ) =&gt; {resolveTypeName(type)}
      </InlineCode>
    ));
  }
  return undefined;
};

export const renderFlags = (flags?: TypePropertyDataFlags) =>
  flags?.isOptional ? (
    <>
      <br />
      <span css={STYLES_OPTIONAL}>(optional)</span>
    </>
  ) : undefined;

export type CommentTextBlockProps = {
  comment?: CommentData;
  components?: MDComponents;
  withDash?: boolean;
  beforeContent?: JSX.Element | null;
  afterContent?: JSX.Element | null;
  includePlatforms?: boolean;
};

export const parseCommentContent = (content?: string): string =>
  content && content.length ? content.replace(/&ast;/g, '*').replace(/\t/g, '') : '';

export const getCommentOrSignatureComment = (
  comment?: CommentData,
  signatures?: MethodSignatureData[]
) => comment || (signatures && signatures[0]?.comment);

export const getTagData = (tagName: string, comment?: CommentData) =>
  getAllTagData(tagName, comment)?.[0];

export const getAllTagData = (tagName: string, comment?: CommentData) =>
  comment?.tags?.filter(tag => tag.tag === tagName);

const getCleanPlatformName = (platform: CommentTagData) => {
  if (platform.text.includes('ios')) return 'ios';
  if (platform.text.includes('android')) return 'android';
  if (platform.text.includes('web')) return 'web';
  if (platform.text.includes('expo')) return 'expo';
  return undefined;
};

const renderPlatformIcon = (platform: CommentTagData) => {
  const iconProps = { size: iconSize.micro, css: STYLES_PLATFORM_ICON };

  switch (getCleanPlatformName(platform)) {
    case 'ios':
      return <AppleIcon color={theme.palette.blue['900']} {...iconProps} />;
    case 'android':
      return <AndroidIcon color={theme.palette.green['900']} {...iconProps} />;
    case 'web':
      return <AtSignIcon color={theme.palette.orange['900']} {...iconProps} />;
    case 'expo':
      return (
        <ExpoGoLogo
          width={iconProps.size}
          height={iconProps.size}
          color={theme.palette.purple['900']}
          css={STYLES_PLATFORM_ICON}
        />
      );
    default:
      return undefined;
  }
};

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

const formatPlatformName = (name: string) => {
  const cleanName = name.toLowerCase().replace('\n', '');
  if (cleanName.includes('ios')) {
    return cleanName.replace('ios', 'iOS');
  } else if (cleanName.includes('expo')) {
    return cleanName.replace('expo', 'Expo Go');
  } else {
    return capitalize(name);
  }
};

export const getPlatformTags = (comment?: CommentData) => {
  const platforms = getAllTagData('platform', comment);
  return platforms?.length ? (
    <>
      {platforms.map(platform => {
        const platformName = getCleanPlatformName(platform);
        return (
          <div
            key={platformName}
            css={[
              STYLES_PLATFORM,
              platformName === 'android' && STYLES_ANDROID_PLATFORM,
              platformName === 'ios' && STYLES_IOS_PLATFORM,
              platformName === 'web' && STYLES_WEB_PLATFORM,
              platformName === 'expo' && STYLES_EXPO_PLATFORM,
            ]}>
            {renderPlatformIcon(platform)}
            {formatPlatformName(platform.text)}
          </div>
        );
      })}
    </>
  ) : null;
};

export const CommentTextBlock = ({
  comment,
  components = mdComponents,
  withDash,
  beforeContent,
  afterContent,
  includePlatforms = true,
}: CommentTextBlockProps) => {
  const shortText = comment?.shortText?.trim().length ? (
    <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
      {parseCommentContent(comment.shortText)}
    </ReactMarkdown>
  ) : null;
  const text = comment?.text?.trim().length ? (
    <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
      {parseCommentContent(comment.text)}
    </ReactMarkdown>
  ) : null;

  const examples = getAllTagData('example', comment);
  const exampleText = examples?.map((example, index) => (
    <React.Fragment key={'example-' + index}>
      {components !== mdComponents ? (
        <div css={STYLES_EXAMPLE_IN_TABLE}>
          <B>Example</B>
        </div>
      ) : (
        <H4>Example</H4>
      )}
      <ReactMarkdown components={components}>{example.text}</ReactMarkdown>
    </React.Fragment>
  ));

  const deprecation = getTagData('deprecated', comment);
  const deprecationNote = deprecation ? (
    <Quote key="deprecation-note">
      {deprecation.text.trim().length ? (
        <ReactMarkdown
          components={mdInlineComponents}>{`**Deprecated.** ${deprecation.text}`}</ReactMarkdown>
      ) : (
        <B>Deprecated</B>
      )}
    </Quote>
  ) : null;

  const see = getTagData('see', comment);
  const seeText = see ? (
    <Quote>
      <B>See: </B>
      <ReactMarkdown components={mdInlineComponents}>{see.text}</ReactMarkdown>
    </Quote>
  ) : null;

  return (
    <>
      {!withDash && includePlatforms && getPlatformTags(comment) && (
        <>
          <B>Only for:</B> {getPlatformTags(comment)}
          <br />
        </>
      )}
      {deprecationNote}
      {beforeContent}
      {withDash && (shortText || text) && ' - '}
      {withDash && includePlatforms && getPlatformTags(comment)}
      {shortText}
      {text}
      {afterContent}
      {seeText}
      {exampleText}
    </>
  );
};

export const getComponentName = (name?: string, children: PropData[] = []) => {
  if (name && name !== 'default') return name;
  const ctor = children.filter((child: PropData) => child.name === 'constructor')[0];
  return ctor?.signatures?.[0]?.type?.name ?? 'default';
};

export const STYLES_APIBOX = css({
  borderRadius: borderRadius.medium,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: theme.border.default,
  padding: `${spacing[1]}px ${spacing[5]}px`,
  boxShadow: shadows.micro,
  marginBottom: spacing[6],

  h3: {
    marginTop: spacing[4],
  },

  table: {
    boxShadow: 'none',
  },

  [`@media screen and (max-width: ${Constants.breakpoints.mobile})`]: {
    padding: `0 ${spacing[4]}px`,
  },
});

export const STYLES_APIBOX_NESTED = css({
  marginBottom: spacing[1],
  border: 0,
  borderRadius: 0,
  padding: `${spacing[1]}px 0`,
  borderBottom: `1px solid ${theme.border.default}`,
  boxShadow: 'none',

  ':last-of-type': {
    borderBottom: 0,
    marginBottom: 0,
  },
});

export const STYLES_NESTED_SECTION_HEADER = css({
  display: 'flex',
  borderTop: `1px solid ${theme.border.default}`,
  borderBottom: `1px solid ${theme.border.default}`,
  margin: `${spacing[6]}px -${spacing[5]}px 0`,
  padding: `${spacing[2.5]}px ${spacing[5]}px`,
  backgroundColor: theme.background.secondary,

  h4: {
    marginBottom: 0,
  },
});

export const STYLES_NOT_EXPOSED_HEADER = css({
  marginTop: spacing[5],
  marginBottom: spacing[2],
  display: 'inline-block',
});

export const STYLES_OPTIONAL = css`
  color: ${theme.text.secondary};
  font-size: 90%;
  padding-top: 22px;
`;

export const STYLES_SECONDARY = css`
  color: ${theme.text.secondary};
  font-size: 90%;
  font-weight: 600;
`;

export const STYLES_PLATFORM = css`
  display: inline-block;
  background-color: ${theme.background.tertiary};
  color: ${theme.text.default};
  font-size: 90%;
  font-weight: 700;
  padding: ${spacing[1]}px ${spacing[2]}px;
  margin-bottom: ${spacing[2]}px;
  margin-left: ${spacing[1]}px;
  margin-right: ${spacing[1]}px;
  border-radius: ${borderRadius.small}px;
  border: 1px solid ${theme.border.default};

  table & {
    margin-bottom: ${spacing[2]}px;
    padding: 0 ${spacing[1.5]}px;
  }
`;

export const STYLES_PLATFORM_ICON = css({
  marginRight: spacing[1],
  marginBottom: spacing[0.5],
  verticalAlign: 'middle',
});

export const STYLES_ANDROID_PLATFORM = css`
  background-color: ${theme.palette.green['000']};
  color: ${theme.palette.green['900']};
  border-color: ${theme.palette.green['200']};
`;

export const STYLES_IOS_PLATFORM = css`
  background-color: ${theme.palette.blue['000']};
  color: ${theme.palette.blue['900']};
  border-color: ${theme.palette.blue['200']};
`;

export const STYLES_WEB_PLATFORM = css`
  background-color: ${theme.palette.orange['000']};
  color: ${theme.palette.orange['900']};
  border-color: ${theme.palette.orange['200']};
`;

export const STYLES_EXPO_PLATFORM = css`
  background-color: ${theme.palette.purple['000']};
  color: ${theme.palette.purple['900']};
  border-color: ${theme.palette.purple['200']};
`;

const STYLES_EXAMPLE_IN_TABLE = css`
  margin: 8px 0;
`;
