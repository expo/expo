import styled, { keyframes, css } from 'react-emotion';

import * as React from 'react';
import * as Constants from '~/common/constants';

import { paragraph } from './typography';

const attributes = {
  'data-text': true,
};

const STYLES_PARAGRAPH = css`
  ${paragraph}
  margin-bottom: 1.5rem;
`;

export const P = ({ children }) => (
  <p {...attributes} className={STYLES_PARAGRAPH}>
    {children}
  </p>
);

const STYLES_BOLD_PARAGRAPH = css`
  ${paragraph}
  font-size: inherit;
  font-family: ${Constants.fontFamilies.bold};
  font-weight: 500;
`;

const B = ({ children }) => <strong className={STYLES_BOLD_PARAGRAPH}>{children}</strong>;

P.B = B;

const STYLES_PARAGRAPH_DIV = css`
  ${paragraph}
  display: block;
  margin-bottom: 1.5rem;

  &.is-wider {
    max-width: 1200px;
  }

  @media screen and (max-width: ${Constants.breakpoints.mobile}) {
    &.is-wider {
      max-width: 100%;
      width: 100%;
    }
  }
`;

export const PDIV = ({ children }) => {
  const isWider = children.props && children.props.snackId;
  return (
    <div {...attributes} className={`${STYLES_PARAGRAPH_DIV} ${isWider ? 'is-wider' : ''}`}>
      {children}
    </div>
  );
};

const STYLES_BLOCKQUOTE = css`
  ${paragraph}
  padding: 16px;
  margin-bottom: 1.5rem;
  border-left: 4px solid ${Constants.expoColors.gray[250]};
  background: ${Constants.expoColors.gray[100]};
  border-radius: 4px;

  div {
    margin: 0;
  }
`;

export const Quote = ({ children }) => (
  <blockquote {...attributes} className={STYLES_BLOCKQUOTE}>
    {children}
  </blockquote>
);
