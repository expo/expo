import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import NextLink from 'next/link';
import * as React from 'react';

type LinkProps = React.PropsWithChildren<{
  href?: string;
}>;

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

const Link = (props: LinkProps) =>
  isLinkAbsolute(props.href) ? <ExternalLink {...props} /> : <InternalLink {...props} />;

export default Link;

export const InternalLink = ({ href, children }: LinkProps) => (
  <NextLink href={href || ''} passHref>
    <a css={STYLES_EXTERNAL_LINK}>{children}</a>
  </NextLink>
);

export const ExternalLink = ({ href, children }: LinkProps) => (
  <a href={href} css={STYLES_EXTERNAL_LINK} rel="noopener noreferrer">
    {children}
  </a>
);
