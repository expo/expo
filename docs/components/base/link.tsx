import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import NextLink from 'next/link';
import * as React from 'react';

type LinkProps = {
  href?: string;
};

const STYLES_EXTERNAL_LINK = css`
  color: ${theme.link.default};
  font-size: inherit;

  :hover {
    text-decoration: underline;
  }

  code {
    color: ${theme.link.default};
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
