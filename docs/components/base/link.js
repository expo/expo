import styled, { keyframes, css } from 'react-emotion';
import NextLink from 'next/link';

import * as React from 'react';
import * as Constants from '~/common/constants';

const STYLES_INTERNAL_LINK = css`
  text-decoration: none;
  color: ${Constants.colors.expoLighter};
  font-size: inherit;

  :hover {
    text-decoration: underline;
  }
`;

export const InternalLink = ({ href, as, children }) => (
  <NextLink prefetch href={href} as={as}>
    <a className={STYLES_INTERNAL_LINK}>{children}</a>
  </NextLink>
);

const STYLES_EXTERNAL_LINK = css`
  text-decoration: none;
  color: ${Constants.colors.expoLighter};
  font-size: inherit;

  :hover {
    text-decoration: underline;
  }
`;

export const ExternalLink = ({ href, children }) => (
  <a href={href} className={STYLES_EXTERNAL_LINK} rel="noopener noreferrer">
    {children}
  </a>
);
