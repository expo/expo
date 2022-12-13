import { css, CSSObject } from '@emotion/react';
import { spacing, typography } from '@expo/styleguide';
import React, { ComponentType, PropsWithChildren } from 'react';

import { createPermalinkedComponent } from '~/common/create-permalinked-component';
import { Code as PrismCodeBlock } from '~/components/base/code';
import { Callout } from '~/ui/components/Callout';
import { Cell, HeaderCell, Row, Table, TableHead } from '~/ui/components/Table';
import { H1, H2, H3, H4, H5, A, CODE, P, BOLD, UL, OL, LI, KBD } from '~/ui/components/Text';

type Config = ConfigStyles & {
  Component: ComponentType<React.PropsWithChildren<ComponentProps>> | string;
};

type ConfigStyles = {
  css?: CSSObject;
  style?: React.CSSProperties;
};

type ComponentProps = PropsWithChildren<{
  className?: string;
  style?: React.CSSProperties;
}>;

const markdownStyles: Record<string, Config | null> = {
  h1: {
    Component: createPermalinkedComponent(H1, { baseNestingLevel: 1 }),
    style: {
      marginTop: spacing[2],
      marginBottom: spacing[6],
      paddingBottom: spacing[4],
    },
  },
  h2: {
    Component: createPermalinkedComponent(H2, { baseNestingLevel: 2 }),
    style: {
      marginTop: spacing[8],
      marginBottom: spacing[3],
    },
  },
  h3: {
    Component: createPermalinkedComponent(H3, { baseNestingLevel: 3 }),
    style: {
      marginTop: spacing[6],
      marginBottom: spacing[1.5],
    },
  },
  h4: {
    Component: createPermalinkedComponent(H4, { baseNestingLevel: 4 }),
    style: {
      marginTop: spacing[6],
      marginBottom: spacing[1],
    },
  },
  h5: {
    Component: createPermalinkedComponent(H5, { baseNestingLevel: 5 }),
    style: {
      marginTop: spacing[4],
      marginBottom: spacing[1],
    },
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
    style: { paddingBottom: '0.5ch', paddingLeft: `1ch` },
  },
  ol: {
    Component: OL,
    style: { paddingBottom: '0.5ch', paddingLeft: `1ch` },
  },
  li: {
    Component: LI,
  },
  hr: {
    Component: 'hr',
    css: typography.utility.hr,
    style: { margin: `2ch 0` },
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
    css: typography.utility.anchor,
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
};

export const markdownComponents = Object.keys(markdownStyles).reduce(
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

function createMarkdownComponent(config: Config) {
  const { Component, css: cssClassname, style } = config;
  const MDXComponent = (props: ComponentProps) => (
    <Component {...props} css={css(cssClassname)} style={style}>
      {props.children}
    </Component>
  );
  MDXComponent.displayName = `Markdown(${componentName(config)})`;
  return MDXComponent;
}
