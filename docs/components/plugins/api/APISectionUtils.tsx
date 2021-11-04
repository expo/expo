import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
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
  MethodParamData,
  MethodSignatureData,
  PropData,
  TypeDefinitionData,
  TypePropertyDataFlags,
} from '~/components/plugins/api/APIDataTypes';

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
  a: ({ href, children }) => <Link href={href}>{children}</Link>,
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
  'React.FC',
  'ServiceActionResult',
  'StyleProp',
  'T',
  'TaskOptions',
  'Uint8Array',
  // Cross-package permissions management
  'RequestPermissionMethod',
  'GetPermissionMethod',
  'Options',
  'PermissionHookBehavior',
];

const hardcodedTypeLinks: Record<string, string> = {
  Date: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date',
  Element: 'https://www.typescriptlang.org/docs/handbook/jsx.html#function-component',
  Error: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error',
  Omit: 'https://www.typescriptlang.org/docs/handbook/utility-types.html#omittype-keys',
  Pick: 'https://www.typescriptlang.org/docs/handbook/utility-types.html#picktype-keys',
  Partial: 'https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype',
  Promise:
    'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise',
  View: '../../react-native/view',
  ViewProps: '../../react-native/view#props',
  ViewStyle: '../../react-native/view-style-props/',
};

const renderWithLink = (name: string, type?: string) =>
  nonLinkableTypes.includes(name) ? (
    name + (type === 'array' ? '[]' : '')
  ) : (
    <Link href={hardcodedTypeLinks[name] || `#${name.toLowerCase()}`} key={`type-link-${name}`}>
      {name}
      {type === 'array' && '[]'}
    </Link>
  );

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
  beforeContent?: JSX.Element;
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

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

const formatPlatformName = (name: string) => {
  const cleanName = name.toLowerCase().replace('\n', '');
  return cleanName.includes('ios')
    ? cleanName.replace('ios', 'iOS')
    : cleanName.includes('expo')
    ? cleanName.replace('expo', 'Expo Go')
    : capitalize(name);
};

export const getPlatformTags = (comment?: CommentData) => {
  const platforms = getAllTagData('platform', comment);
  return platforms?.length ? (
    <>
      {platforms.map(platform => (
        <div key={platform.text} css={STYLES_PLATFORM}>
          {formatPlatformName(platform.text)} Only
        </div>
      ))}
      <br />
    </>
  ) : null;
};

export const CommentTextBlock = ({
  comment,
  components = mdComponents,
  withDash,
  beforeContent,
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

  const example = getTagData('example', comment);
  const exampleText = example ? (
    <>
      <H4>Example</H4>
      <ReactMarkdown components={components}>{example.text}</ReactMarkdown>
    </>
  ) : null;

  const deprecation = getTagData('deprecated', comment);
  const deprecationNote = deprecation ? (
    <Quote key="deprecation-note">
      {deprecation.text.trim().length ? (
        <ReactMarkdown components={mdInlineComponents}>{deprecation.text}</ReactMarkdown>
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
      {deprecationNote}
      {beforeContent}
      {withDash && (shortText || text) && ' - '}
      {includePlatforms && getPlatformTags(comment)}
      {shortText}
      {text}
      {seeText}
      {exampleText}
    </>
  );
};

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
  padding: 6px 12px;
  margin-bottom: 8px;
  margin-right: 8px;
  border-radius: 4px;
`;
