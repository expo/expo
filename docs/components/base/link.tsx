import { css } from '@emotion/core';
import NextLink from 'next/link';
import * as React from 'react';

import * as Constants from '~/constants/theme';

type LinkProps = {
  href?: string;
};

const STYLES_EXTERNAL_LINK = css`
  color: ${Constants.expoColors.primary[500]};
  font-size: inherit;

  :hover {
    text-decoration: underline;
  }
`;

function isLinkAbsolute(href?: string) {
  return href?.includes('://');
}

const Link: React.FC<LinkProps> = props =>
  isLinkAbsolute(props.href) ? <ExternalLink {...props} /> : <InternalLink {...props} />;

export default Link;

export const InternalLink: React.FC<LinkProps> = ({ href, children }) => (
  <NextLink href={href || ''} passHref>
    <a css={STYLES_EXTERNAL_LINK}>{children}</a>
  </NextLink>
);

export const ExternalLink: React.FC<LinkProps> = ({ href, children }) => (
  <a href={href} css={STYLES_EXTERNAL_LINK} rel="noopener noreferrer">
    {children}
  </a>
);
