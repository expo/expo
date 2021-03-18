import React from 'react';
import ReactMarkdown from 'react-markdown';

import { InlineCode } from '~/components/base/code';
import { InternalLink } from '~/components/base/link';
import { LI, UL } from '~/components/base/list';
import { P } from '~/components/base/paragraph';

export type DataProps = {
  data: Record<string, any>[];
};

export enum TypeDocKind {
  Enum = 4,
  Function = 64,
  TypeAlias = 4194304,
}

export const renderers: React.ComponentProps<typeof ReactMarkdown>['renderers'] = {
  inlineCode: ({ value }) => <InlineCode>{value}</InlineCode>,
  list: ({ children }) => <UL>{children}</UL>,
  listItem: ({ children }) => <LI>{children}</LI>,
  link: ({ href, children }) => <InternalLink href={href}>{children}</InternalLink>,
  paragraph: ({ children }) => (children ? <P>{children}</P> : null),
  text: ({ value }) => (value ? <span>{value}</span> : null),
};

export const resolveTypeName = ({
  elementType,
  name,
  type,
  typeArguments,
}: any): string | JSX.Element => {
  if (name) {
    if (type === 'reference') {
      if (typeArguments) {
        if (name === 'Promise') {
          return (
            <span>
              {'Promise<'}
              {typeArguments.map(resolveTypeName)}
              {'>'}
            </span>
          );
        } else {
          return typeArguments.map(resolveTypeName);
        }
      } else {
        return (
          <InternalLink href={`#${name.toLowerCase()}`} key={`type-link-${name}`}>
            {name}
          </InternalLink>
        );
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
