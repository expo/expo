import styled, { keyframes, css } from 'react-emotion';

import * as React from 'react';
import * as Constants from '~/common/constants';

const attributes = {
  'data-heading': true,
};

const STYLES_H1 = css`
  font-family: ${Constants.fonts.bold};
  font-size: 2.4rem;
  line-height: 2.75rem;
  margin-bottom: 1.5rem;
  margin-top: 0.1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid ${Constants.colors.border};
  letter-spacing: -0.022em;
`;

export const H1 = ({ children }) => (
  <h1 {...attributes} className={STYLES_H1}>
    {children}
  </h1>
);

const STYLES_H2 = css`
  font-family: ${Constants.fonts.bold};
  line-height: 150%;
  font-size: 1.5rem;
  margin-bottom: 1rem;
  margin-top: 2.2rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid ${Constants.colors.border};
  letter-spacing: -0.018em;
`;

export const H2 = ({ children }) => (
  <h2 {...attributes} className={STYLES_H2}>
    {children}
  </h2>
);

const STYLES_H3 = css`
  font-size: 1.1rem;
  line-height: 150%;
  font-family: ${Constants.fonts.bold};
  margin-bottom: 1rem;
  margin-top: 2rem;

  code.inline {
    padding: 2px 4px;
    top: 0;
    font-size: 1.1rem;
    line-height: 150%;
  }
`;

export const H3 = ({ children }) => (
  <h3 {...attributes} className={STYLES_H3}>
    {children}
  </h3>
);

const STYLES_H4 = css`
  font-family: ${Constants.fonts.bold};
  font-weight: 400;
  line-height: 1.625rem;
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
`;

export const H4 = ({ children }) => (
  <h4 {...attributes} className={STYLES_H4}>
    {children}
  </h4>
);
