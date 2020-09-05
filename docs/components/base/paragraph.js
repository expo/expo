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
  margin-bottom: 1.4rem;
  line-height: 150%;
  letterspacing: -0.011em;

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
  padding: 20px;
  padding-top: 16px;
  margin-bottom: 1.5rem;
  color: ${Constants.colors.black90};
  border: 1px solid ${Constants.expoColors.gray[250]};
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
