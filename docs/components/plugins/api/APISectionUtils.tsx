import { css } from '@emotion/react';
import { borderRadius, shadows, spacing, theme, typography } from '@expo/styleguide';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Code, InlineCode } from '~/components/base/code';
import { H4 } from '~/components/base/headings';
import Link from '~/components/base/link';
import { LI, UL, OL } from '~/components/base/list';
import { B, P, Quote } from '~/components/base/paragraph';
import {
  CommentData,
  MethodParamData,
  MethodSignatureData,
  PropData,
  TypeDefinitionData,
  TypePropertyDataFlags,
} from '~/components/plugins/api/APIDataTypes';
import { PlatformTags } from '~/components/plugins/api/APISectionPlatformTags';
import * as Constants from '~/constants/theme';
import { Callout } from '~/ui/components/Callout';
import { Cell, HeaderCell, Row, Table, TableHead } from '~/ui/components/Table';
import { tableWrapperStyle } from '~/ui/components/Table/Table';

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
  ol: ({ children }) => <OL>{children}</OL>,
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

export const renderParamRow = ({ comment, name, type, flags }: MethodParamData): JSX.Element => {
  const defaultValue = parseCommentContent(getTagData('default', comment)?.text);
  return (
    <Row key={`param-${name}`}>
      <Cell>
        <B>{parseParamName(name)}</B>
        {renderFlags(flags)}
      </Cell>
      <Cell>
        <InlineCode>{resolveTypeName(type)}</InlineCode>
      </Cell>
      <Cell>
        <CommentTextBlock
          comment={comment}
          components={mdInlineComponents}
          afterContent={renderDefaultValue(defaultValue)}
          emptyCommentFallback="-"
        />
      </Cell>
    </Row>
  );
};

export const renderTableHeadRow = () => (
  <TableHead>
    <Row>
      <HeaderCell>Name</HeaderCell>
      <HeaderCell>Type</HeaderCell>
      <HeaderCell>Description</HeaderCell>
    </Row>
  </TableHead>
);

export const renderParams = (parameters: MethodParamData[]) => (
  <Table>
    {renderTableHeadRow()}
    <tbody>{parameters?.map(renderParamRow)}</tbody>
  </Table>
);

export const listParams = (parameters: MethodParamData[]) =>
  parameters ? parameters?.map(param => parseParamName(param.name)).join(', ') : '';

export const renderDefaultValue = (defaultValue?: string) =>
  defaultValue ? (
    <div css={defaultValueContainerStyle}>
      <B>Default:</B> <InlineCode>{defaultValue}</InlineCode>
    </div>
  ) : undefined;

export const renderTypeOrSignatureType = (
  type?: TypeDefinitionData,
  signatures?: MethodSignatureData[],
  includeParamType: boolean = false
) => {
  if (type) {
    return <InlineCode key={`signature-type-${type.name}`}>{resolveTypeName(type)}</InlineCode>;
  } else if (signatures && signatures.length) {
    return signatures.map(({ parameters }) =>
      parameters && includeParamType
        ? parameters.map(param => (
            <span key={`signature-param-${param.name}`}>
              {param.name}
              {param.flags?.isOptional && '?'}: {resolveTypeName(param.type)}
            </span>
          ))
        : listParams(parameters)
    );
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
  beforeContent?: JSX.Element;
  afterContent?: JSX.Element;
  includePlatforms?: boolean;
  emptyCommentFallback?: string;
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

export const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export const CommentTextBlock = ({
  comment,
  components = mdComponents,
  withDash,
  beforeContent,
  afterContent,
  includePlatforms = true,
  emptyCommentFallback,
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

  if (emptyCommentFallback && (!comment || (!shortText && !text))) {
    return <>{emptyCommentFallback}</>;
  }

  const examples = getAllTagData('example', comment);
  const exampleText = examples?.map((example, index) => (
    <React.Fragment key={'example-' + index}>
      {components !== mdComponents ? (
        <div css={STYLES_EXAMPLE_IN_TABLE}>
          <B>Example</B>
        </div>
      ) : (
        <div css={STYLES_NESTED_SECTION_HEADER}>
          <H4>Example</H4>
        </div>
      )}
      <ReactMarkdown components={components}>{example.text}</ReactMarkdown>
    </React.Fragment>
  ));

  const deprecation = getTagData('deprecated', comment);
  const deprecationNote = deprecation ? (
    <div css={deprecationNoticeStyle}>
      <Callout type="warning" key="deprecation-note">
        {deprecation.text.trim().length ? (
          <ReactMarkdown
            components={mdInlineComponents}>{`**Deprecated.** ${deprecation.text}`}</ReactMarkdown>
        ) : (
          <B>Deprecated</B>
        )}
      </Callout>
    </div>
  ) : null;

  const see = getTagData('see', comment);
  const seeText = see ? (
    <Quote>
      <B>See: </B>
      <ReactMarkdown components={mdInlineComponents}>{see.text}</ReactMarkdown>
    </Quote>
  ) : null;

  const hasPlatforms = (getAllTagData('platform', comment)?.length || 0) > 0;

  return (
    <>
      {!withDash && includePlatforms && hasPlatforms && (
        <PlatformTags comment={comment} prefix="Only for:" />
      )}
      {deprecationNote}
      {beforeContent}
      {withDash && (shortText || text) && ' - '}
      {withDash && includePlatforms && <PlatformTags comment={comment} />}
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
  overflowX: 'hidden',

  h3: {
    marginTop: spacing[4],
  },

  [`.css-${tableWrapperStyle.name}`]: {
    boxShadow: 'none',
  },

  [`@media screen and (max-width: ${Constants.breakpoints.mobile})`]: {
    padding: `0 ${spacing[4]}px`,
  },
});

export const STYLES_APIBOX_NESTED = css({
  boxShadow: 'none',
});

export const STYLES_NESTED_SECTION_HEADER = css({
  display: 'flex',
  borderTop: `1px solid ${theme.border.default}`,
  borderBottom: `1px solid ${theme.border.default}`,
  margin: `${spacing[6]}px -${spacing[5]}px ${spacing[4]}px`,
  padding: `${spacing[2.5]}px ${spacing[5]}px`,
  backgroundColor: theme.background.secondary,

  h4: {
    ...typography.fontSizes[16],
    marginBottom: 0,
  },
});

export const STYLES_NOT_EXPOSED_HEADER = css({
  marginTop: spacing[5],
  marginBottom: spacing[2],
  display: 'inline-block',
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
});

const deprecationNoticeStyle = css({
  marginBottom: spacing[2],
});

const STYLES_EXAMPLE_IN_TABLE = css({
  margin: `${spacing[2]}px 0`,
});
