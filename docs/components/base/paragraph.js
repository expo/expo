import styled, { keyframes, css } from 'react-emotion';

import * as React from 'react';
import * as Constants from '~/common/constants';

const attributes = {
  'data-text': true,
};

const STYLES_PARAGRAPH = css`
  font-size: 1rem;
  line-height: 1.725rem;
  margin-bottom: 1.5rem;
`;

export const P = ({ children }) => (
  <p {...attributes} className={STYLES_PARAGRAPH}>
    {children}
  </p>
);

const STYLES_BOLD_PARAGRAPH = css`
  font-family: ${Constants.fontFamilies.bold};
  font-weight: 400;
  letter-spacing: 0.3px;
`;

const B = ({ children }) => <strong className={STYLES_BOLD_PARAGRAPH}>{children}</strong>;

P.B = B;

const STYLES_PARAGRAPH_DIV = css`
  font-size: 1rem;
  line-height: 1.8rem;
  margin-bottom: 1.4rem;

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
  font-family: ${Constants.fontFamilies.book};
  padding: 12px 24px;
  border-left: 5px solid ${Constants.colors.darkGrey};
  margin: 0 0 1.5rem 0;
  color: ${Constants.colors.black80};

  div {
    margin: 0;
  }
`;

export const Quote = ({ children }) => (
  <blockquote {...attributes} className={STYLES_BLOCKQUOTE}>
    {children}
  </blockquote>
);
