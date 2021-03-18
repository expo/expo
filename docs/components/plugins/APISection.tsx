import { css } from '@emotion/core';
import { theme } from '@expo/styleguide';
import React, { useContext } from 'react';
import ReactMarkdown from 'react-markdown';

import DocumentationPageContext from '~/components/DocumentationPageContext';
import { InlineCode } from '~/components/base/code';
import { InternalLink } from '~/components/base/link';
import { UL, LI } from '~/components/base/list';
import { B, P } from '~/components/base/paragraph';
import { paragraph } from '~/components/base/typography';
import { H2, H3, H4 } from '~/components/plugins/Headings';

const LATEST_VERSION = `v${require('~/package.json').version}`;

const STYLES_OPTIONAL = css`
  color: ${theme.text.secondary};
  font-size: 90%;
  padding-top: 22px;
`;

type Props = {
  packageName: string;
};

type DataProps = {
  data: Record<string, any>[];
};

const renderers: React.ComponentProps<typeof ReactMarkdown>['renderers'] = {
  inlineCode: ({ value }) => <InlineCode>{value}</InlineCode>,
  list: ({ children }) => <UL>{children}</UL>,
  listItem: ({ children }) => <LI>{children}</LI>,
  link: ({ href, children }) => <InternalLink href={href}>{children}</InternalLink>,
  paragraph: ({ children }) => (children ? <P>{children}</P> : null),
  text: ({ value }) => (value ? <span css={paragraph}>{value}</span> : null),
};

const resolveTypeName = ({ elementType, name, type, typeArguments }: any): string | JSX.Element => {
  if (name) {
    if (type === 'reference') {
      if (typeArguments) {
        if (name === 'Promise') {
          return <span>{`Promise<${typeArguments.map(resolveTypeName)}>`}</span>;
        } else {
          return typeArguments.map(resolveTypeName);
        }
      } else {
        return <InternalLink href={`#${name.toLowerCase()}`}>{name}</InternalLink>;
      }
    } else {
      return name;
    }
  } else if (elementType.name) {
    if (type === 'array') {
      return elementType.name + '[]';
    }
    return elementType.name + type;
  }
  return 'undefined';
};

const Methods: React.FC<DataProps> = ({ data }) =>
  data ? (
    <>
      <H2 key="methods-header">Methods</H2>
      {data.map(renderMethod)}
    </>
  ) : null;

const renderMethod = ({ signatures }: any): JSX.Element =>
  signatures.map((signature: any) => {
    const { name, parameters, comment, type } = signature;
    return (
      <div key={`method-signature-${name}-${parameters?.length || 0}`}>
        <H3>
          <InlineCode>{name}()</InlineCode>
        </H3>
        {parameters ? <H4>Arguments</H4> : null}
        {parameters ? (
          <UL>
            {parameters?.map((p: any) => (
              <LI key={`param-${p.name}`}>
                <InlineCode>
                  {p.name}: {resolveTypeName(p.type)}
                </InlineCode>
              </LI>
            ))}
          </UL>
        ) : null}
        {comment?.shortText ? (
          <ReactMarkdown renderers={renderers}>{comment.shortText}</ReactMarkdown>
        ) : null}
        <br />
        {comment?.returns ? <H4>Returns</H4> : null}
        {comment?.returns ? (
          <UL>
            <LI returnType>
              <InlineCode>{resolveTypeName(type)}</InlineCode>
            </LI>
          </UL>
        ) : null}
        {comment?.returns ? (
          <ReactMarkdown renderers={renderers}>{comment.returns}</ReactMarkdown>
        ) : null}
        <hr />
      </div>
    );
  });

const Enums: React.FC<DataProps> = ({ data }) =>
  data ? (
    <>
      <H2 key="enums-header">Enums</H2>
      {data.map(renderEnum)}
    </>
  ) : null;

const renderEnum = ({ name, children, comment }: any): JSX.Element => {
  return (
    <div key={`enum-definition-${name}`}>
      <H3>
        <InlineCode>{name}</InlineCode>
      </H3>
      <UL>
        {children.map((enumValue: any) => (
          <LI key={enumValue.name}>
            <InlineCode>
              {name}.{enumValue.name}
            </InlineCode>
            {comment ? ` - ${comment.shortText}` : null}
          </LI>
        ))}
      </UL>
    </div>
  );
};

const Types: React.FC<DataProps> = ({ data }) =>
  data ? (
    <>
      <H2 key="types-header">Types</H2>
      {data.map(renderType)}
    </>
  ) : null;

const renderType = ({ name, comment, type }: any): JSX.Element => {
  return (
    <div key={`type-definition-${name}`}>
      <H3>
        <InlineCode>{name}</InlineCode>
      </H3>
      {comment ? <ReactMarkdown renderers={renderers}>{comment.shortText}</ReactMarkdown> : null}
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {type.declaration.children.map((typeProperty: any) => (
            <tr key={typeProperty.name}>
              <td>
                <B>{typeProperty.name}</B>
                {typeProperty.flags?.isOptional ? (
                  <>
                    <br />
                    <span css={STYLES_OPTIONAL}>(optional)</span>
                  </>
                ) : null}
              </td>
              <td>
                <InlineCode>{resolveTypeName(typeProperty.type)}</InlineCode>
              </td>
              <td>{typeProperty.comment ? typeProperty.comment.shortText : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

enum TypeDocKind {
  Enum = 4,
  Function = 64,
  TypeAlias = 4194304,
}

const renderAPI = (packageName: string, version: string = 'unversioned'): JSX.Element => {
  try {
    const data = require(`~/public/static/data/${version}/${packageName}.json`);

    const methods = data.children?.filter((g: any) => g.kind === TypeDocKind.Function);
    const types = data.children?.filter((g: any) => g.kind === TypeDocKind.TypeAlias);
    const enums = data.children?.filter((g: any) => g.kind === TypeDocKind.Enum);

    // TODO: Props, Constants, Static Methods and probably few more sections

    return (
      <div>
        <Methods data={methods} />
        <Types data={types} />
        <Enums data={enums} />
      </div>
    );
  } catch (e) {
    console.warn(`~/public/static/data/${version}/${packageName}.json`, e);
    return <P>No API data file found, sorry!</P>;
  }
};

const APISection: React.FC<Props> = ({ packageName }) => {
  const { version } = useContext(DocumentationPageContext);
  const resolvedVersion =
    version === 'unversioned' ? version : version === 'latest' ? LATEST_VERSION : version;
  return renderAPI(packageName, resolvedVersion);
};

export default APISection;
