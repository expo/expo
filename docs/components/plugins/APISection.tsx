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

const renderers: React.ComponentProps<typeof ReactMarkdown>['renderers'] = {
  inlineCode: ({ value }) => <InlineCode>{value}</InlineCode>,
  list: ({ children }) => <UL>{children}</UL>,
  listItem: ({ children }) => <LI>{children}</LI>,
  link: ({ href, children }) => <InternalLink href={href}>{children}</InternalLink>,
  text: ({ value }) => <span css={paragraph}>{value}</span>,
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

const renderMethod = ({ signatures }: any): JSX.Element =>
  signatures.map((signature: any) => {
    const { name, parameters, comment, type } = signature;
    return (
      <>
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
      </>
    );
  });

const renderEnum = ({ name, children, comment }: any): JSX.Element => {
  return (
    <>
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
    </>
  );
};

const renderType = ({ name, comment, type }: any): JSX.Element => {
  return (
    <>
      <H3>
        <InlineCode>{name}</InlineCode>
      </H3>
      {comment ? (
        <P>
          <ReactMarkdown renderers={renderers}>{comment.shortText}</ReactMarkdown>
        </P>
      ) : null}
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
    </>
  );
};

const processData = (packageName: string, version: string = 'unversioned'): JSX.Element => {
  try {
    const data = require(`~/public/static/data/${version}/${packageName}.json`);

    const methods = data.children.filter(g => g.kind === 64);
    const types = data.children.filter(g => g.kind === 4194304);
    const enums = data.children.filter(g => g.kind === 4);

    // TODO: Props, Constants, Static Methods and probably few more sections

    return (
      <>
        {methods ? <H2>Methods</H2> : null}
        {methods ? methods.map(renderMethod) : null}
        {types ? <H2>Types</H2> : null}
        {types ? types.map(renderType) : null}
        {enums ? <H2>Enums</H2> : null}
        {enums ? enums.map(renderEnum) : null}
      </>
    );
  } catch (e) {
    console.warn(e);
    return <P>No API data file found!</P>;
  }
};

const APISection: React.FC<Props> = ({ packageName }) => {
  const { version } = useContext(DocumentationPageContext);
  const resolvedVersion =
    version === 'unversioned' ? version : version === 'latest' ? LATEST_VERSION : version;
  return processData(packageName, resolvedVersion);
};

export default APISection;
