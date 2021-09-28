import { css, CSSObject } from '@emotion/react';
import { colors } from '@expo/styleguide';
import React from 'react';

import { Blockquote } from './Blockquote';

import { Code } from '~/ui/components/Snippet';
import { Table, Row, Cell, HeaderCell } from '~/ui/components/Table';
import { A, H1, H2, H3, H4, H5, CODE, P, BOLD, UL, LI } from '~/ui/components/Text';
import { textStyles } from '~/ui/foundations/typography';

type MarkdownConfigType = {
  [i: string]: Config;
};

type Config = ConfigStyles & {
  Component: ((props: ComponentProps) => JSX.Element) | string;
};

type ConfigStyles = {
  css?: CSSObject;
  style?: React.CSSProperties;
};

type ComponentProps = {
  children: React.ReactChildren;
  className?: string;
  style?: React.CSSProperties;
};

function hasKey<O>(obj: O, key: keyof any): key is keyof O {
  return key in obj;
}

const headerMarginBottom = '0.5ch';
const paragraphMarginBottom = '1ch';
const headerPaddingTop = '1.5ch';

const markdownStyles: MarkdownConfigType = {
  h1: {
    Component: H1,
    style: { marginBottom: headerMarginBottom },
  },
  h2: {
    Component: H2,
    style: { marginBottom: headerMarginBottom, paddingTop: headerPaddingTop },
  },
  h3: {
    Component: H3,
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
    style: { paddingBottom: paragraphMarginBottom },
  },
  ol: {
    Component: UL,
    style: { paddingBottom: paragraphMarginBottom },
  },
  li: {
    Component: LI,
    css: textStyles.li,
  },
  hr: {
    Component: 'hr',
    style: { border: 'none', borderTop: `1px solid ${colors.gray[400]}`, margin: `2ch 0` },
  },
  blockquote: {
    Component: Blockquote,
    style: { marginBottom: paragraphMarginBottom },
  },
  img: {
    Component: 'img',
    style: { width: '100%' },
  },
  code: {
    Component: Code,
    style: { marginBottom: paragraphMarginBottom },
  },
  inlineCode: {
    Component: CODE,
  },
  a: {
    Component: A,
    style: { textDecoration: 'underline' },
  },
  details: {
    Component: 'details',
    css: textStyles.p,
  },
  summary: {
    Component: 'summary',
    css: textStyles.p,
    style: {
      marginBottom: 16,
    },
  },
  table: {
    Component: Table,
  },
  tr: {
    Component: Row,
  },
  td: {
    Component: Cell,
  },
  th: {
    Component: HeaderCell,
  },
};

const generateMarkdownComponent = (config: Config) => {
  const { Component, css: cssClassname, style } = config;
  return (props: ComponentProps) => {
    return (
      <Component {...props} css={css(cssClassname)} style={style}>
        {props.children}
      </Component>
    );
  };
};

export const MarkdownComponents = Object.keys(markdownStyles).reduce((acc, key) => {
  if (hasKey(markdownStyles, key)) {
    return {
      ...acc,
      [key]: generateMarkdownComponent(markdownStyles[key]),
    };
  } else {
    return acc;
  }
}, {});
