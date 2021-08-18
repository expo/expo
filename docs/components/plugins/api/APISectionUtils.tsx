import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import React from 'react';
import ReactMarkdown from 'react-markdown';

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
  Enum = 4,
  Variable = 32,
  Function = 64,
  Class = 128,
  Interface = 256,
  Property = 1024,
  TypeAlias = 4194304,
}

export type MDRenderers = React.ComponentProps<typeof ReactMarkdown>['renderers'];

export const mdRenderers: MDRenderers = {
  blockquote: ({ children }) => (
    <Quote>
      {React.Children.map(children, child =>
        child.type.name === 'paragraph' ? child.props.children : child
      )}
    </Quote>
  ),
  code: ({ value, language }) => <Code className={`language-${language}`}>{value}</Code>,
  heading: ({ children }) => <H4>{children}</H4>,
  inlineCode: ({ value }) => <InlineCode>{value}</InlineCode>,
  list: ({ children }) => <UL>{children}</UL>,
  listItem: ({ children }) => <LI>{children}</LI>,
  link: ({ href, children }) => <Link href={href}>{children}</Link>,
  paragraph: ({ children }) => (children ? <P>{children}</P> : null),
  strong: ({ children }) => <B>{children}</B>,
  text: ({ value }) => (value ? <span>{value}</span> : null),
};

export const mdInlineRenderers: MDRenderers = {
  ...mdRenderers,
  paragraph: ({ children }) => (children ? <span>{children}</span> : null),
};

const nonLinkableTypes = [
  'ColorValue',
  'E',
  'EventSubscription',
  'File',
  'FileList',
  'Manifest',
  'NativeSyntheticEvent',
  'Omit',
  'Pick',
  'React.FC',
  'ServiceActionResult',
  'StyleProp',
  'T',
  'TaskOptions',
  'Uint8Array',
  'RequestPermissionMethod',
  'GetPermissionMethod',
];

const hardcodedTypeLinks: Record<string, string> = {
  Date: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date',
  Error: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error',
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
};

export const parseParamName = (name: string) => (name.startsWith('__') ? name.substr(2) : name);

export const renderParam = ({ comment, name, type, flags }: MethodParamData): JSX.Element => (
  <LI key={`param-${name}`}>
    <B>
      {parseParamName(name)}
      {flags?.isOptional && '?'} (<InlineCode>{resolveTypeName(type)}</InlineCode>)
    </B>
    <CommentTextBlock comment={comment} renderers={mdInlineRenderers} withDash />
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
    return <InlineCode>{resolveTypeName(type)}</InlineCode>;
  } else if (signatures && signatures.length) {
    return signatures.map(({ name, type, parameters }) => (
      <InlineCode key={`signature-type-${name}`}>
        (
        {parameters && includeParamType
          ? parameters.map(param => (
              <>
                {param.name}
                {param.flags?.isOptional && '?'}: {resolveTypeName(param.type)}
              </>
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
  renderers?: MDRenderers;
  withDash?: boolean;
  beforeContent?: JSX.Element;
};

export const parseCommentContent = (content?: string): string =>
  content && content.length ? content.replace(/&ast;/g, '*') : '';

export const getCommentOrSignatureComment = (
  comment?: CommentData,
  signatures?: MethodSignatureData[]
) => comment || (signatures && signatures[0]?.comment);

export const CommentTextBlock: React.FC<CommentTextBlockProps> = ({
  comment,
  renderers = mdRenderers,
  withDash,
  beforeContent,
}) => {
  const shortText = comment?.shortText?.trim().length ? (
    <ReactMarkdown renderers={renderers}>{parseCommentContent(comment.shortText)}</ReactMarkdown>
  ) : null;
  const text = comment?.text?.trim().length ? (
    <ReactMarkdown renderers={renderers}>{parseCommentContent(comment.text)}</ReactMarkdown>
  ) : null;

  const example = comment?.tags?.filter(tag => tag.tag === 'example')[0];
  const exampleText = example ? (
    <ReactMarkdown renderers={renderers}>{`__Example:__ ${example.text}`}</ReactMarkdown>
  ) : null;

  const deprecation = comment?.tags?.filter(tag => tag.tag === 'deprecated')[0];
  const deprecationNote = deprecation ? (
    <Quote key="deprecation-note">
      {deprecation.text.trim().length ? (
        <ReactMarkdown renderers={mdInlineRenderers}>{deprecation.text}</ReactMarkdown>
      ) : (
        <B>Deprecated</B>
      )}
    </Quote>
  ) : null;

  return (
    <>
      {deprecationNote}
      {beforeContent}
      {withDash && (shortText || text) ? ' - ' : null}
      {shortText}
      {text}
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
