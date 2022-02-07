import { css } from '@emotion/react';
import { theme, typography } from '@expo/styleguide';
import * as React from 'react';

import { h1, h2, h3, h4 } from './typography';

const attributes = {
  'data-heading': true,
};

const STYLES_H1 = css`
  ${h1}
  margin-top: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid ${theme.border.default};
`;

export const H1: React.FC = ({ children, ...rest }) => (
  <h1 {...attributes} css={STYLES_H1} {...rest}>
    {children}
  </h1>
);

const STYLES_H2 = css`
  ${h2}
  margin-bottom: 1rem;
  margin-top: 2rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid ${theme.border.default};

  code {
    ${h2}
    font-family: ${typography.fontFaces.mono};
    padding: 1px 8px;
    border-radius: 4px;
  }
`;

export const H2: React.FC = ({ children, ...rest }) => (
  <h2 {...attributes} css={STYLES_H2} {...rest}>
    {children}
  </h2>
);

const STYLES_H3 = css`
  ${h3}
  margin-bottom: 1rem;
  margin-top: 2rem;

  code {
    ${h3}
    font-family: ${typography.fontFaces.mono};
    padding: 1px 6px;
    border-radius: 4px;
  }
`;

export const H3: React.FC = ({ children, ...rest }) => (
  <h3 {...attributes} css={STYLES_H3} {...rest}>
    {children}
  </h3>
);

const STYLES_H4 = css`
  ${h4}
  margin-bottom: 0.25rem;

  code {
    ${h4}
    font-family: ${typography.fontFaces.mono};
    padding: 1px 6px;
    border-radius: 4px;
  }
`;

export const H4: React.FC = ({ children, ...rest }) => (
  <h4 {...attributes} css={STYLES_H4} {...rest}>
    {children}
  </h4>
);
