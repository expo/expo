import type { ComponentType, PropsWithChildren } from 'react';

import { Code as PrismCodeBlock } from '~/components/base/code';
import { Callout } from '~/ui/components/Callout';
import { Cell, HeaderCell, Row, Table, TableHead } from '~/ui/components/Table';
import { H1, H2, H3, H4, H5, A, CODE, P, BOLD, UL, OL, LI, KBD, DEL } from '~/ui/components/Text';

type Config = ConfigStyles & {
  Component: ComponentType<PropsWithChildren<ComponentProps>> | string;
};

type ConfigStyles = {
  className?: string;
};

type ComponentProps = PropsWithChildren<{
  className?: string;
}>;

const markdownStyles: Record<string, Config | null> = {
  h1: {
    Component: H1,
  },
  h2: {
    Component: H2,
  },
  h3: {
    Component: H3,
  },
  h4: {
    Component: H4,
  },
  h5: {
    Component: H5,
  },
  p: {
    Component: P,
    className: 'mb-[1.5ch]',
  },
  strong: {
    Component: BOLD,
  },
  ul: {
    Component: UL,
    className: 'mb-[1.5ch] pl-[1ch]',
  },
  ol: {
    Component: OL,
    className: 'mb-[1.5ch] pl-[1ch]',
  },
  li: {
    Component: LI,
  },
  hr: {
    Component: 'hr',
    className: 'border-0 bg-palette-gray6 h-px mb-[2ch] mt-12',
  },
  blockquote: {
    Component: Callout,
  },
  img: {
    Component: 'img',
    className: 'w-full',
  },
  code: {
    Component: CODE,
  },
  pre: {
    Component: PrismCodeBlock,
  },
  a: {
    Component: A,
  },
  table: {
    Component: Table,
  },
  thead: {
    Component: TableHead,
  },
  tr: {
    Component: Row,
  },
  th: {
    Component: HeaderCell,
  },
  td: {
    Component: Cell,
  },
  kbd: {
    Component: KBD,
  },
  del: {
    Component: DEL,
  },
};

type MarkdownComponent = Record<keyof typeof markdownStyles, any>;

export const markdownComponents: MarkdownComponent = Object.keys(markdownStyles).reduce(
  (all, key) => ({
    ...all,
    [key]: markdownStyles[key] ? createMarkdownComponent(markdownStyles[key]!) : null,
  }),
  {}
);

function componentName({ Component }: Config) {
  if (typeof Component === 'string') return Component;
  return Component.displayName || Component.name || 'Anonymous';
}

function createMarkdownComponent(config: Config): ComponentType<ComponentProps> {
  const { Component, className } = config;
  const MDXComponent = (props: ComponentProps) => (
    <Component {...props} className={className}>
      {props.children}
    </Component>
  );
  MDXComponent.displayName = `Markdown(${componentName(config)})`;
  return MDXComponent;
}
