import { css } from '@emotion/core';
import { theme } from '@expo/styleguide';
import * as React from 'react';
import ReactMarkdown from 'react-markdown';

import { InlineCode } from '~/components/base/code';
import { InternalLink } from '~/components/base/link';
import { UL, LI } from '~/components/base/list';
import { B, P } from '~/components/base/paragraph';
import { paragraph } from '~/components/base/typography';
import { H2, H3, H4 } from '~/components/plugins/Headings';

const STYLES_OPTIONAL = css`
  color: ${theme.text.secondary};
  font-size: 90%;
  padding-top: 22px;
`;

type Props = {
  packageName: string;
};

const renderers = {
  inlineCode: ({ value }) => <InlineCode>{value}</InlineCode>,
  list: ({ children }) => <UL>{children}</UL>,
  listItem: ({ children }) => <LI>{children}</LI>,
  link: ({ href, children }) => <InternalLink href={href}>{children}</InternalLink>,
  text: ({ value }) => <span css={paragraph}>{value}</span>,
};

const resolveTypeName = (typeEntry: object): string | JSX.Element => {
  const { name, type, elementType, typeArguments } = typeEntry;
  if (name) {
    if (type === 'reference') {
      if (typeArguments) {
        if (name === 'Promise') {
          return (
            <>
              {`Promise<`}
              {typeArguments.map(resolveTypeName)}
              {`>`}
            </>
          );
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

const renderMethod = (methodEntry: object): JSX.Element =>
  methodEntry.signatures.map((signature) => (
    <>
      <H3>
        <InlineCode>{signature.name}()</InlineCode>
      </H3>
      {signature.parameters ? <H4>Arguments</H4> : null}
      {signature.parameters ? (
        <UL>
          {signature.parameters?.map(p => (
            <LI>
              <InlineCode>
                {p.name}: {resolveTypeName(p.type)}
              </InlineCode>
            </LI>
          ))}
        </UL>
      ) : null}
      {signature.comment?.shortText ? (
        <ReactMarkdown renderers={renderers}>{signature.comment.shortText}</ReactMarkdown>
      ) : null}
      <br />
      {signature.comment?.returns ? <H4>Returns</H4> : null}
      {signature.comment?.returns ? (
        <UL><LI returnType><InlineCode>{resolveTypeName(signature.type)}</InlineCode></LI></UL>
      ) : null}
      {signature.comment?.returns ? (
        <ReactMarkdown renderers={renderers}>{signature.comment.returns}</ReactMarkdown>
      ) : null}
      <hr/>
    </>
  ));

const renderEnum = (enumEntry: object): JSX.Element => (
  <>
    <H3>
      <InlineCode>{enumEntry.name}</InlineCode>
    </H3>
    <UL>
      {enumEntry.children.map(enumValue => (
        <LI key={enumValue.name}>
          <InlineCode>
            {enumEntry.name}.{enumValue.name}
          </InlineCode>
          {enumEntry.comment ? ` - ${enumEntry.comment.shortText}` : null}
        </LI>
      ))}
    </UL>
  </>
);

const renderType = (typeEntry: object): JSX.Element => (
  <>
    <H3>
      <InlineCode>{typeEntry.name}</InlineCode>
    </H3>
    {typeEntry.comment ? (
      <P><ReactMarkdown renderers={renderers}>{typeEntry.comment.shortText}</ReactMarkdown></P>
    ) : null}
    <table>
      <thead>
        <tr>
          <th>Name</th>
          {/*<th>Optional</th>*/}
          <th>Type</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {typeEntry.type.declaration.children.map(typeProperty => (
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
            {/*<td>{typeProperty.flags?.isOptional ? <em>Yes</em> : <em>No</em>}</td>*/}
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

const processData = (packageName: string): JSX.Element => {
  const data = require('~/data/' + packageName + '.json');

  const methods = data.children.filter(g => g.kind === 64);
  const types = data.children.filter(g => g.kind === 4194304);
  const enums = data.children.filter(g => g.kind === 4);

  console.warn(methods[0]);

  return (
    <>
      {/*<H2>Props</H2>*/}
      {methods ? <H2>Methods</H2> : null}
      {methods ? methods.map(renderMethod) : null}
      {types ? <H2>Types</H2> : null}
      {types ? types.map(renderType) : null}
      {enums ? <H2>Enums</H2> : null}
      {enums ? enums.map(renderEnum) : null}
    </>
  );
};

const APISection: React.FC<Props> = ({ packageName }) => <div>{processData(packageName)}</div>;

export default APISection;
