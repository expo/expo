import { css, CSSObject } from '@emotion/react';
import { typography, theme } from '@expo/styleguide';
import React, { ComponentType, PropsWithChildren } from 'react';

import { A, H1, H2, H4, H5, CODE, P, BOLD, UL, OL, LI } from '~/ui/components/Text';

type Config = ConfigStyles & {
  Component: ComponentType<ComponentProps> | string;
};

type ConfigStyles = {
  css?: CSSObject;
  style?: React.CSSProperties;
};

type ComponentProps = PropsWithChildren<{
  className?: string;
  style?: React.CSSProperties;
}>;

const headerMarginBottom = '0.5ch';
const paragraphMarginBottom = '1ch';
const headerPaddingTop = '1.5ch';

const markdownStyles: Record<string, Config | null> = {
  // When using inline markdown, we need to remove the document layout wrapper.
  // Always set this to `null` to overwrite the global MDX provider.
  wrapper: null,
  h1: {
    Component: H1,
    style: { marginBottom: headerMarginBottom },
  },
  h2: {
    Component: H2,
    style: { marginBottom: headerMarginBottom, paddingTop: headerPaddingTop },
  },
  h3: {
    Component: H4,
    style: { marginBottom: headerMarginBottom, paddingTop: headerPaddingTop },
  },
  h4: {
    Component: H4,
    style: { marginBottom: headerMarginBottom, paddingTop: headerPaddingTop },
  },
  h5: {
    Component: H5,
    style: { marginBottom: headerMarginBottom, paddingTop: headerPaddingTop },
  },
  p: {
    Component: P,
    style: { marginBottom: paragraphMarginBottom },
  },
  strong: {
    Component: BOLD,
  },
  ul: {
    Component: UL,
    style: { paddingBottom: paragraphMarginBottom, marginLeft: '2ch' },
  },
  ol: {
    Component: OL,
    style: { paddingBottom: paragraphMarginBottom, marginLeft: '2ch' },
  },
  li: {
    Component: LI,
    css: typography.body.li,
  },
  hr: {
    Component: 'hr',
    css: typography.utility.hr,
    style: { margin: `2ch 0` },
  },
  blockquote: {
    Component: 'div',
    css: typography.body.blockquote,
  },
  img: {
    Component: 'img',
    style: { width: '100%' },
  },
  code: {
    Component: 'pre',
    css: typography.utility.pre,
  },
  inlineCode: {
    Component: CODE,
  },
  a: {
    Component: A,
    css: typography.utility.anchor,
  },
  details: {
    Component: 'details',
    css: typography.body.paragraph,
  },
  summary: {
    Component: 'summary',
    css: typography.body.paragraph,
    style: {
      marginBottom: 16,
    },
  },
  table: {
    Component: 'table',
    style: {
      margin: '16px 0px 32px 0px',
      borderCollapse: 'collapse',
    },
  },
  th: {
    Component: 'th',
    css: typography.body.headline,
    style: {
      border: `1px solid ${theme.border.default}`,
      padding: '12px',
      verticalAlign: 'middle',
    },
  },
  td: {
    Component: 'td',
    css: typography.body.paragraph,
    style: { padding: '12px', border: `1px solid ${theme.border.default}` },
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
