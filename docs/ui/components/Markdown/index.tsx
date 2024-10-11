import { css, CSSObject } from '@emotion/react';
import { typography } from '@expo/styleguide';
import type { CSSProperties, ComponentType, PropsWithChildren } from 'react';

import { Code as PrismCodeBlock } from '~/components/base/code';
import { Callout } from '~/ui/components/Callout';
import { Cell, HeaderCell, Row, Table, TableHead } from '~/ui/components/Table';
import { H1, H2, H3, H4, H5, A, CODE, P, BOLD, UL, OL, LI, KBD, DEL } from '~/ui/components/Text';

type Config = ConfigStyles & {
  Component: ComponentType<PropsWithChildren<ComponentProps>> | string;
};

type ConfigStyles = {
  css?: CSSObject;
  style?: CSSProperties;
};

type ComponentProps = PropsWithChildren<{
  className?: string;
  style?: CSSProperties;
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
    style: { marginBottom: '1.5ch' },
  },
  strong: {
    Component: BOLD,
  },
  ul: {
    Component: UL,
    style: { marginBottom: '1.5ch', paddingLeft: `1ch` },
  },
  ol: {
    Component: OL,
    style: { marginBottom: '1.5ch', paddingLeft: `1ch` },
  },
  li: {
    Component: LI,
  },
  hr: {
    Component: 'hr',
    css: typography.utility.hr,
    style: {
      margin: `2ch 0`,
      marginTop: '3rem',
    },
  },
  blockquote: {
    Component: Callout,
  },
  img: {
    Component: 'img',
    style: { width: '100%' },
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
  const { Component, css: cssClassname, style } = config;
  const MDXComponent = (props: ComponentProps) => (
    <Component {...props} css={css(cssClassname)} style={style}>
      {props.children}
    </Component>
  );
  MDXComponent.displayName = `Markdown(${componentName(config)})`;
  return MDXComponent;
}
