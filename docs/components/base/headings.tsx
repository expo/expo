import { css } from '@emotion/react';
import { theme, spacing, typography } from '@expo/styleguide';
import * as React from 'react';

import { h1, h2, h3, h4 } from './typography';

type HeadingProps = React.PropsWithChildren<React.HTMLAttributes<HTMLHeadingElement>>;

const attributes = {
  'data-heading': true,
};

const STYLES_H1 = css`
  ${h1}
  margin-top: ${spacing[2]}px;
  margin-bottom: ${spacing[6]}px;
  padding-bottom: ${spacing[4]}px;
  border-bottom: 1px solid ${theme.border.default};
`;

export const H1 = ({ children }: HeadingProps) => (
  <h1 {...attributes} css={STYLES_H1}>
    {children}
  </h1>
);

const STYLES_H2 = css`
  ${h2}
  margin-bottom: ${spacing[3]}px;
  margin-top: ${spacing[8]}px;

  code {
    ${h2}
    font-family: ${typography.fontFaces.mono};
    padding: 1px 8px;
    border-radius: 4px;
  }
`;

export const H2 = ({ children }: HeadingProps) => (
  <h2 {...attributes} css={STYLES_H2}>
    {children}
  </h2>
);

const STYLES_H3 = css`
  ${h3}
  margin-bottom: ${spacing[1.5]}px;
  margin-top: ${spacing[6]}px;

  code {
    ${h3}
    font-family: ${typography.fontFaces.mono};
    padding: 1px 6px;
    border-radius: 4px;
  }
`;

export const H3 = ({ children }: HeadingProps) => (
  <h3 {...attributes} css={STYLES_H3}>
    {children}
  </h3>
);

const STYLES_H4 = css`
  ${h4}
  margin-top: ${spacing[6]}px;
  margin-bottom: ${spacing[1]}px;

  code {
    ${h4}
    font-family: ${typography.fontFaces.mono};
    padding: 1px 6px;
    border-radius: 4px;
  }
`;

export const H4 = ({ children, ...rest }: HeadingProps) => (
  <h4 {...attributes} css={STYLES_H4} {...rest}>
    {children}
  </h4>
);
